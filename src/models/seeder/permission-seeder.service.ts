import { Injectable, OnModuleInit } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { PermissionDescriptions, Permissions } from '@/common/permissions';
import { permissions as permissionSchema } from '@/models/schema/permissions.schema';
import { rolePermissions as rolePermissionsSchema, roles as roleSchema } from '@/models/schema/roles.schema';
import { RolesService } from '@/modules/roles/roles.service';
import { Permission } from '@/types';
import { flattenPermissions } from '@/utils';

import { DrizzleService } from '../model.service';

@Injectable()
export class PermissionSeederService implements OnModuleInit {
    private db;

    private readonly PREDEFINED_ROLES: Record<string, { isAdmin: boolean; isDefault: boolean; description: string; permissions: string[] | 'ALL' }> = {
        Admin: {
            isAdmin: true,
            isDefault: false,
            description: 'System administrator with full access',
            permissions: 'ALL',
        },
        Authenticated: {
            isAdmin: false,
            isDefault: true,
            description: 'Default role for new users',
            permissions: [
                Permissions.users.Read,
                Permissions.users.Update,
                Permissions.attachments.Read,
                Permissions.attachments.Write,
                Permissions.attachments.Update,
                Permissions.attachments.Delete,
                Permissions.notifications.Read,
                Permissions.notifications.Update,
                Permissions.notifications.Delete,
                Permissions.organizations.Create,
                Permissions.organizations.Update,
                Permissions.vibe.Read,
                Permissions.vibe.Write,
            ],
        },
        Worker: {
            isAdmin: false,
            isDefault: false,
            description: 'Production floor worker',
            permissions: [
                Permissions.execution.Read,
                Permissions.execution.Write,
                Permissions.traceability.Read,
                Permissions.traceability.Write,
                Permissions.work_orders.Read,
                Permissions.nodes.Read,
                Permissions.inventory.Read,
                Permissions.attachments.Read,
                Permissions.attachments.Write,
                Permissions.attachments.Update,
                Permissions.attachments.Delete,
                Permissions.notifications.Read,
                Permissions.notifications.Update,
                Permissions.notifications.Delete,
                Permissions.users.Read,
                Permissions.users.Update,
            ],
        },
        Supervisor: {
            isAdmin: false,
            isDefault: false,
            description: 'Production supervisor',
            permissions: [
                Permissions.execution.Read,
                Permissions.execution.Write,
                Permissions.execution.ReadAll,
                Permissions.traceability.Read,
                Permissions.traceability.Write,
                Permissions.traceability.ReadAll,
                Permissions.work_orders.Read,
                Permissions.work_orders.ReadAll,
                Permissions.work_orders.Write,
                Permissions.work_orders.Update,
                Permissions.work_orders.Release,
                Permissions.orders.ReadAll,
                Permissions.orders.UpdateAll,
                Permissions.nodes.Read,
                Permissions.nodes.ReadAll,
                Permissions.nodes.Update,
                Permissions.nodes.Write,
                Permissions.users.Read,
                Permissions.users.ReadAll,
                Permissions.roles.Read,
                Permissions.tickets.Read,
                Permissions.tickets.ReadAll,
                Permissions.tickets.UpdateStatus,
                Permissions.tickets.UpdateStatusAll,
                Permissions.tickets.AddMessage,
                Permissions.tickets.AddMessageAll,
                Permissions.bom.Read,
                Permissions.bom.ReadAll,
                Permissions.bom.Update,
                Permissions.bom.Write,
                Permissions.products.Read,
                Permissions.products.ReadAll,
                Permissions.products.Update,
                Permissions.products.Write,
                Permissions.organizations.Read,
                Permissions.attachments.Read,
                Permissions.attachments.ReadAll,
                Permissions.attachments.Write,
                Permissions.attachments.Update,
                Permissions.attachments.Delete,
                Permissions.notifications.Read,
                Permissions.notifications.ReadAll,
                Permissions.notifications.Update,
                Permissions.notifications.Delete,
                Permissions.traceability.ReadAudit,
                Permissions.vibe.Read,
                Permissions.vibe.ReadAll,
                Permissions.vibe.Write,
                Permissions.vibe.Update,
                Permissions.vibe.Delete,
            ],
        },
        Storekeeper: {
            isAdmin: false,
            isDefault: false,
            description: 'Warehouse and inventory manager',
            permissions: [
                Permissions.inventory.Read,
                Permissions.inventory.ReadAll,
                Permissions.inventory.Write,
                Permissions.inventory.Update,
                Permissions.inventory.Delete,
                Permissions.bom.Read,
                Permissions.bom.ReadAll,
                Permissions.products.Read,
                Permissions.products.ReadAll,
                Permissions.work_orders.Read,
                Permissions.work_orders.ReadAll,
                Permissions.attachments.Read,
                Permissions.attachments.Write,
                Permissions.notifications.Read,
                Permissions.notifications.Update,
                Permissions.users.Read,
                Permissions.users.Update,
            ],
        },
    };

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly rolesService: RolesService,
    ) {
        if (this.logger) {
            this.logger.setContext(PermissionSeederService.name);
        }
        this.db = this.drizzle.database;
    }

    async onModuleInit() {
        await this.seedPermissionsAndRoles();
    }

    private async seedPermissionsAndRoles() {
        this.logger.log('🔄 Syncing permissions and roles...');

        const canonicalPermissions = flattenPermissions(Permissions);

        await this.db.transaction(async (tx) => {
            // --- 1. Sync Permissions ---
            const existing = await tx.query.permissions.findMany();
            const existingNames = existing.map((p) => p.name);

            // Insert missing ones
            const missing = canonicalPermissions.filter((p) => !existingNames.includes(p));
            if (missing.length > 0) {
                await tx.insert(permissionSchema).values(
                    missing.map((name) => ({
                        name,
                        description: PermissionDescriptions?.[name] ?? 'Description not provided.',
                    })),
                );
                this.logger.log(`✅ Inserted ${missing.length} new permissions`);
            }

            // Remove invalid (in DB but not in canonical list)
            const invalid = existingNames.filter((p) => !canonicalPermissions.includes(p as Permission));
            if (invalid.length > 0) {
                await tx.delete(permissionSchema).where(inArray(permissionSchema.name, invalid));
                this.logger.warn(`⚠️ Removed invalid permissions: ${invalid}`);
            }

            // --- 2. Ensure Roles ---
            const existingRoles = await tx.query.roles.findMany();
            const existingRoleNames = existingRoles.map((r) => r.name);

            const rolesToInsert = Object.keys(this.PREDEFINED_ROLES).filter((name) => !existingRoleNames.includes(name));

            if (rolesToInsert.length > 0) {
                await tx.insert(roleSchema).values(
                    rolesToInsert.map((name) => ({
                        name,
                        description: this.PREDEFINED_ROLES[name].description,
                        isAdmin: this.PREDEFINED_ROLES[name].isAdmin,
                        isDefault: this.PREDEFINED_ROLES[name].isDefault,
                    })),
                );
                this.logger.log(`✅ Inserted roles: ${rolesToInsert}`);
            }

            // Fetch fresh roles + permissions
            const allRoles = await tx.query.roles.findMany();
            const allPerms = await tx.query.permissions.findMany();

            // --- 3. Sync Role Permissions ---
            for (const role of allRoles) {
                const config = this.PREDEFINED_ROLES[role.name];
                if (!config) continue;

                let targetPermNames: string[] = [];
                if (config.permissions === 'ALL') {
                    targetPermNames = allPerms.map((p) => p.name);
                } else if (Array.isArray(config.permissions)) {
                    targetPermNames = config.permissions;
                }

                const targetPermIds = allPerms.filter((p) => targetPermNames.includes(p.name)).map((p) => p.id);

                const existingMappings = await tx.query.rolePermissions.findMany({
                    where: eq(rolePermissionsSchema.roleId, role.id),
                });
                const existingPermIds = existingMappings.map((rp) => rp.permissionId);

                const toAdd = targetPermIds.filter((id) => !existingPermIds.includes(id));

                if (toAdd.length > 0) {
                    await tx.insert(rolePermissionsSchema).values(
                        toAdd.map((pId) => ({
                            roleId: role.id,
                            permissionId: pId,
                        })),
                    );
                    this.logger.log(`✅ Added ${toAdd.length} permissions to role '${role.name}'`);
                }
            }
        });

        // --- 4. Sync Redis ---
        await this.rolesService.syncAll();
        this.logger.log('🎯 Permission & Role seeding completed.');
    }
}
