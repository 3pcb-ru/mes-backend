import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { RedisService } from '@/app/services/redis/redis.service';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import { DrizzleTransaction } from '@/models/model.types';
import { permissions } from '@/models/schema';
import { rolePermissions, rolePermissions as rolePermissionsSchema, roles as roleSchema } from '@/models/schema/roles.schema';
import { user as userSchema } from '@/models/schema/users.schema';
import { RoleInsertInput } from '@/models/zod-schemas';
import { JwtUser } from '@/types/jwt.types';

import { UsersService } from '../users/users.service';
import { CreateRoleDto, UpdateRoleDetailsDto } from './roles.dto';

@Injectable()
export class RolesService extends BaseFilterableService {
    private db;

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly redisService: RedisService,
        private readonly eventEmitter: EventEmitter2,
        private readonly userService: UsersService,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(RolesService.name);
        this.db = this.drizzle.database;
    }

    async syncAll() {
        // 1️⃣ Fetch all role → permissions in a single query
        const rows = await this.db
            .select({
                roleId: rolePermissions.roleId,
                permName: permissions.name,
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

        const permsByRole: Record<string, string[]> = {};
        for (const row of rows) {
            if (!permsByRole[row.roleId]) permsByRole[row.roleId] = [];
            permsByRole[row.roleId].push(row.permName);
        }

        const allRoles = await this.db.query.roles.findMany();

        // 2️⃣ Build pipeline for Redis
        const pipeline = this.redisService.getClient().pipeline();

        let syncedCount = 0;
        for (const role of allRoles) {
            const permList = permsByRole[role.id] || [];
            const existingKeyValue = await this.redisService.get(`perms:${role.id}`);
            if (existingKeyValue !== JSON.stringify(permList)) {
                syncedCount++;
                pipeline.set(`perms:${role.id}`, JSON.stringify(permList));
            }
        }

        await pipeline.exec();

        this.logger.log(`✅ Synced ${syncedCount} roles into Redis`);
    }

    async setPermissionToken(roleId: string, tsx?: DrizzleTransaction) {
        const dbInstance = tsx ?? this.db;

        const perms = await dbInstance
            .select({ permissions: permissions.name })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, roleId));

        const permissionsList = perms.map((p) => p.permissions);

        await this.redisService.set(`perms:${roleId}`, JSON.stringify(permissionsList));

        this.logger.log(`Synced role ${roleId} with ${permissionsList.length} permissions`);

        return permissionsList;
    }

    async getDefault() {
        const role = await this.db.query.roles.findFirst({
            where: eq(roleSchema.isDefault, true),
        });

        if (!role) {
            throw new InternalServerErrorException('Default role cannot be found on DB. ');
        }

        return role;
    }

    async getAdmin() {
        const role = await this.db.query.roles.findFirst({
            where: eq(roleSchema.isAdmin, true),
        });

        if (!role) {
            throw new InternalServerErrorException('Default role cannot be found on DB. ');
        }

        return role;
    }

    async assignToUser(userId: string, roleId: string) {
        const user = await this.db.query.user.findFirst({
            where: eq(userSchema.id, userId),
        });

        if (!user) {
            throw new BadRequestException(`User cannot be found with id: ${userId}`);
        }

        if (user.roleId === roleId) {
            throw new BadRequestException('User already has provided role');
        }

        const [updatedUser] = await this.db.update(userSchema).set({ roleId }).where(eq(userSchema.id, userId)).returning();

        if (!updatedUser) {
            throw new InternalServerErrorException('An error occured while updating user');
        }

        //Event role change event, and auth listener will logout the user. (We cannot directly use AuthService because of circular dependencies.)
        this.eventEmitter.emit('auth.roleChanged', {
            userId: userId,
        });

        return updatedUser;
    }

    async create(payload: CreateRoleDto, user: JwtUser) {
        const roleData: RoleInsertInput = {
            ...payload,
            organizationId: user.organizationId,
            isAdmin: false,
            isDefault: false,
        };

        const [newRole] = await this.db.insert(roleSchema).values(roleData).returning();

        if (!newRole) {
            throw new InternalServerErrorException('An error occured while creating role');
        }

        return newRole;
    }

    async duplicate(roleId: string, user: JwtUser) {
        const sourceRole = await this.findOneWithPermissions(roleId, user);

        const newRole = await this.db.transaction(async (tx) => {
            const [role] = await tx
                .insert(roleSchema)
                .values({
                    name: `${sourceRole.name} Copy`,
                    description: sourceRole.description,
                    organizationId: user.organizationId,
                    isAdmin: false,
                    isDefault: false,
                })
                .returning();

            if (sourceRole.permissions.length > 0) {
                const rolePerms = sourceRole.permissions.map((p) => ({
                    roleId: role.id,
                    permissionId: p.id,
                }));
                await tx.insert(rolePermissionsSchema).values(rolePerms);
            }

            return role;
        });

        await this.setPermissionToken(newRole.id);
        return newRole;
    }

    async lookup(user: JwtUser) {
        const rolesWithPermissions = await this.db.query.roles.findMany({
            where: or(isNull(roleSchema.organizationId), eq(roleSchema.organizationId, user.organizationId)),
            with: {
                rolePermissions: {
                    columns: {},
                    with: {
                        permission: {
                            columns: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });

        return rolesWithPermissions.map((role) => {
            const { rolePermissions, ...rest } = role;
            return {
                ...rest,
                permissions: rolePermissions.map((rp) => rp.permission),
            };
        });
    }

    async list(user: JwtUser, query: PaginatedFilterQueryDto) {
        const result = await this.filterable(this.db, roleSchema, {
            defaultSortColumn: 'createdAt',
        })
            .filter(query)
            .where(or(isNull(roleSchema.organizationId), eq(roleSchema.organizationId, user.organizationId)))
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .select();

        return result;
    }

    async findOne(roleId: string, user: JwtUser) {
        const role = await this.db.query.roles.findFirst({
            where: and(eq(roleSchema.id, roleId), or(isNull(roleSchema.organizationId), eq(roleSchema.organizationId, user.organizationId))),
        });

        if (!role) {
            throw new NotFoundException(`Role cannot found for id ${roleId}`);
        }

        return role;
    }

    async findOneWithPermissions(roleId: string, user: JwtUser) {
        const role = await this.db.query.roles.findFirst({
            where: and(eq(roleSchema.id, roleId), or(isNull(roleSchema.organizationId), eq(roleSchema.organizationId, user.organizationId))),
            with: {
                rolePermissions: {
                    columns: {
                        permissionId: false,
                        roleId: false,
                    },
                    with: {
                        permission: {
                            columns: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });

        if (!role) {
            throw new NotFoundException(`Role cannot found for id ${roleId}`);
        }

        const { rolePermissions, ...rest } = role;
        return {
            ...rest,
            permissions: rolePermissions.map((rp) => rp.permission),
        };
    }

    async updateDetails(roleId: string, body: UpdateRoleDetailsDto, user: JwtUser) {
        const role = await this.findOne(roleId, user);

        if (!role.organizationId) {
            throw new BadRequestException('System roles cannot be modified.');
        }

        const [updated] = await this.db.update(roleSchema).set(body).where(eq(roleSchema.id, roleId)).returning();

        if (!updated) {
            throw new InternalServerErrorException('An error occurred while updating role details.');
        }

        return updated;
    }

    async updatePermissions(roleId: string, newPermissionIds: string[], user: JwtUser, tsx?: DrizzleTransaction) {
        const dbInstance = tsx ?? this.db;

        if (!newPermissionIds.length) {
            throw new BadRequestException('Permission list cannot be empty.');
        }

        const role = await this.findOne(roleId, user);

        if (!role.organizationId) {
            throw new BadRequestException('System roles cannot be modified.');
        }

        const uniqueNewIds = Array.from(new Set(newPermissionIds));
        await dbInstance.transaction(async (tx) => {
            const permissionsDb = await tx.query.permissions.findMany({
                where: inArray(permissions.id, uniqueNewIds),
            });

            if (permissionsDb?.length !== newPermissionIds.length) {
                throw new BadRequestException('Provided permission ids has no corresponding permissions.');
            }

            const existingPermissions = await tx.query.rolePermissions.findMany({
                where: eq(rolePermissionsSchema.roleId, roleId),
                columns: {
                    permissionId: true,
                },
            });

            const existingPermIds = new Set(existingPermissions.map((rp) => rp.permissionId));

            // Delete any perms no longer present
            const toDelete = [...existingPermIds].filter((id) => !uniqueNewIds.includes(id));
            if (toDelete.length) {
                await tx.delete(rolePermissionsSchema).where(and(eq(rolePermissionsSchema.roleId, roleId), inArray(rolePermissionsSchema.permissionId, toDelete)));
            }

            // Insert any missing assignments
            const toInsert = uniqueNewIds.filter((id) => !existingPermIds.has(id)).map((id) => ({ roleId, permissionId: id }));
            if (toInsert.length) {
                await tx.insert(rolePermissionsSchema).values(toInsert);
            }
        });

        await this.setPermissionToken(roleId);
    }

    async delete(roleId: string, user: JwtUser) {
        const role = await this.findOne(roleId, user);

        if (!role.organizationId) {
            throw new BadRequestException('System roles cannot be deleted.');
        }

        // Check for active users assigned to this role
        const activeUsers = await this.db.query.user.findFirst({
            where: and(eq(userSchema.roleId, roleId), isNull(userSchema.deletedAt)),
        });

        if (activeUsers) {
            throw new BadRequestException('rules in use by active user');
        }

        const [deleted] = await this.db.update(roleSchema).set({ deletedAt: new Date() }).where(eq(roleSchema.id, roleId)).returning();

        if (!deleted) {
            throw new InternalServerErrorException('An error occured while deleting role.');
        }

        return deleted;
    }
}
