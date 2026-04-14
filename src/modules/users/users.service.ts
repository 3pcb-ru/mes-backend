import { BadRequestException, ConflictException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { and, desc, eq, getTableColumns, isNull, ne, sql } from 'drizzle-orm';

import { StorageService } from '@/app/services/storage/storage.service';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { FILE_TYPE } from '@/common/enums';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { UserSettingsOutput, type PublicUserOutput, type UserInsertInput, type UserSelectOutput, type UserUpdateInput } from '@/models/zod-schemas';
import { Pagination } from '@/types';
import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { API_CONFIG_TOKEN, IAppConfiguration } from '@/config';
import { JwtUser } from '@/types/jwt.types';


import { AttachmentService } from '../attachments/attachment.service';
import { MailService } from '@/app/services/mail/mail.service';
import { RandomStringGenerator } from '@/utils/random';
import { InviteUserDto, UpdateUserProfileDto, UpdateUserStatusDto } from './users.dto';

import { UsersPolicy } from './users.policy';
import { OTP_LENGTH } from '@/common/constants';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService extends BaseFilterableService {
    private db;
    private usersPolicy = new UsersPolicy();

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly storageService: StorageService,
        @Inject(forwardRef(() => AttachmentService))
        private readonly attachmentService: AttachmentService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        private readonly logger: CustomLoggerService,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(UsersService.name);
        this.db = this.drizzle.database;
    }


    private async bindUrls(user: any, reqUser?: JwtUser): Promise<PublicUserOutput> {
        if (!user) return user;

        // Fetch user avatar
        const avatar = await this.db.query.attachments.findFirst({
            where: and(
                eq(Schema.attachments.userId, user.id),
                eq(Schema.attachments.type, FILE_TYPE.USER_AVATAR),
                eq(Schema.attachments.isUploaded, true),
                isNull(Schema.attachments.deletedAt),
            ),
            orderBy: desc(Schema.attachments.createdAt),
        });

        if (avatar) {
            user.avatarUrl = await this.attachmentService.getValidPresignedUrl(avatar.id, reqUser as JwtUser);
        }

        // Fetch organization logo if organization exists
        if (user.organization && user.organization.logoId) {
            user.organization.logoUrl = await this.attachmentService.getValidPresignedUrl(user.organization.logoId, reqUser as JwtUser);
        }

        return user;
    }

    async create(data: UserInsertInput): Promise<UserSelectOutput> {
        try {
            const user = await this.db.transaction(async (tx) => {
                const [createdUser] = await tx
                    .insert(Schema.user)
                    .values({ ...data })
                    .returning();

                await tx.insert(Schema.userSettings).values({
                    userId: createdUser.id,
                    consent: false,
                });

                return createdUser;
            });
            return user;
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error) {
                if (error.code === '23505') {
                    if (error.constraint?.includes('email') || error.detail?.includes('email')) {
                        throw new ConflictException('An account with this email already exists.');
                    }
                    throw new ConflictException('This information is already in use.');
                }
            }

            throw error;
        }
    }

    async list(query: PaginatedFilterQueryDto, user: JwtUser): Promise<{ data: PublicUserOutput[] } & Pagination> {
        const policyWhere = await this.usersPolicy.read(user);

        const { password: _, verificationToken: __, deletedAt: ___, ...userFields } = getTableColumns(Schema.user);

        const result = await this.filterable(this.db, Schema.user, {
            defaultSortColumn: 'createdAt',
        })
            .where(policyWhere)
            .filter(query)
            .join(Schema.roles, eq(Schema.user.roleId, Schema.roles.id), 'inner')
            .join(Schema.organization, eq(Schema.user.organizationId, Schema.organization.id), 'left')
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .selectFields({
                ...userFields,
                role: getTableColumns(Schema.roles),
                organization: getTableColumns(Schema.organization),
            });

        const dataWithUrls = await Promise.all(result.data.map(async (u: any) => await this.bindUrls(u, user)));

        return {
            ...result,
            data: dataWithUrls,
        };
    }

    async findOne(id: string, reqUser?: JwtUser): Promise<PublicUserOutput> {
        const policyWhere = reqUser ? await this.usersPolicy.read(reqUser, eq(Schema.user.id, id)) : eq(Schema.user.id, id);
        const [user] = await this.db
            .select({
                id: Schema.user.id,
                email: Schema.user.email,
                firstName: Schema.user.firstName,
                lastName: Schema.user.lastName,
                isVerified: Schema.user.isVerified,
                createdAt: Schema.user.createdAt,
                updatedAt: Schema.user.updatedAt,
                roleId: Schema.user.roleId,
                organizationId: Schema.user.organizationId,
                avatarId: Schema.user.avatarId,
                role: Schema.roles,
                organization: Schema.organization,
            })
            .from(Schema.user)
            .innerJoin(Schema.roles, eq(Schema.user.roleId, Schema.roles.id))
            .leftJoin(Schema.organization, eq(Schema.user.organizationId, Schema.organization.id))
            .where(policyWhere)
            .limit(1);
        if (!user) throw new NotFoundException('User not found');
        return this.bindUrls(user, reqUser);
    }

    async findByEmail(email: string): Promise<UserSelectOutput | null> {
        const [user] = await this.db
            .select({
                ...getTableColumns(Schema.user),
                role: Schema.roles,
                organization: Schema.organization,
            })
            .from(Schema.user)
            .innerJoin(Schema.roles, eq(Schema.user.roleId, Schema.roles.id))
            .leftJoin(Schema.organization, eq(Schema.user.organizationId, Schema.organization.id))
            .where(eq(sql`lower(${Schema.user.email})`, email.toLowerCase()))
            .limit(1);
        return user || null;
    }

    async findByVerificationToken(token: string): Promise<UserSelectOutput | null> {
        const [user] = await this.db
            .select({
                ...getTableColumns(Schema.user),
                role: Schema.roles,
                organization: Schema.organization,
            })
            .from(Schema.user)
            .innerJoin(Schema.roles, eq(Schema.user.roleId, Schema.roles.id))
            .leftJoin(Schema.organization, eq(Schema.user.organizationId, Schema.organization.id))
            .where(eq(Schema.user.verificationToken, token))
            .limit(1);
        return user || null;
    }

    async verify(userId: string): Promise<void> {
        await this.db.update(Schema.user).set({ isVerified: true, verificationToken: null }).where(eq(Schema.user.id, userId));
    }

    async updateVerificationToken(userId: string, verificationToken: string): Promise<void> {
        await this.db
            .update(Schema.user)
            .set({
                verificationToken,
                updatedAt: new Date(),
            })
            .where(eq(Schema.user.id, userId));
    }

    async updateProfile(id: string, data: UpdateUserProfileDto, reqUser: JwtUser): Promise<PublicUserOutput> {
        const policyWhere = await this.usersPolicy.update(reqUser, eq(Schema.user.id, id));
        try {
            // Check if user exists first
            const existingUser = await this.findOne(id);

            // If email is being updated, check for conflicts
            if (data.email && data.email !== existingUser.email) {
                const userWithEmail = await this.findByEmail(data.email);
                if (userWithEmail) {
                    throw new ConflictException('Unable to update profile. Please check your information.');
                }
            }

            // Update only allowed fields with timestamp
            const updateData = {
                ...data,
                updatedAt: new Date(),
            };

            const [updated] = await this.db.update(Schema.user).set(updateData).where(policyWhere).returning();

            if (!updated) {
                //We are throwing 404 here, mostly because security reasons. This condition will be hitted because of the permissions almost all of the time.
                throw new NotFoundException('No user found to match update criterias');
            }

            const [updatedUser] = await this.db
                .select({
                    id: Schema.user.id,
                    email: Schema.user.email,
                    firstName: Schema.user.firstName,
                    lastName: Schema.user.lastName,
                    isVerified: Schema.user.isVerified,
                    createdAt: Schema.user.createdAt,
                    updatedAt: Schema.user.updatedAt,
                    roleId: Schema.user.roleId,
                    organizationId: Schema.user.organizationId,
                    avatarId: Schema.user.avatarId,
                    role: Schema.roles,
                    organization: Schema.organization,
                })
                .from(Schema.user)
                .innerJoin(Schema.roles, eq(Schema.user.roleId, Schema.roles.id))
                .leftJoin(Schema.organization, eq(Schema.user.organizationId, Schema.organization.id))
                .where(eq(Schema.user.id, id));

            if (!updatedUser) {
                throw new NotFoundException('Updated user not found');
            }

            return this.bindUrls(updatedUser, reqUser);
        } catch (error) {
            // Re-throw known exceptions
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }

            // Handle database errors
            throw new Error(`Failed to update user: ${error.message}`, { cause: error });
        }
    }

    // Internal method for system operations (auth, verification, etc.)
    async updateInternal(id: string, data: Partial<UserUpdateInput>): Promise<UserSelectOutput> {
        const updateData = {
            ...data,
            updatedAt: new Date(),
        };

        const [user] = await this.db.update(Schema.user).set(updateData).where(eq(Schema.user.id, id)).returning();
        return user;
    }

    async softDelete(id: string): Promise<UserSelectOutput> {
        const [user] = await this.db.update(Schema.user).set({ deletedAt: new Date() }).where(eq(Schema.user.id, id)).returning();
        return user;
    }

    async restore(id: string): Promise<UserSelectOutput> {
        const [user] = await this.db.update(Schema.user).set({ deletedAt: null }).where(eq(Schema.user.id, id)).returning();
        return user;
    }

    async remove(id: string): Promise<UserSelectOutput> {
        const [user] = await this.db.delete(Schema.user).where(eq(Schema.user.id, id)).returning();
        return user;
    }
    async getUserSettings(userId: string): Promise<UserSettingsOutput> {
        const [settings] = await this.db.select().from(Schema.userSettings).where(eq(Schema.userSettings.userId, userId)).limit(1);
        return settings || null;
    }

    async inviteUser(data: InviteUserDto, inviter: JwtUser): Promise<PublicUserOutput> {
        const { email, firstName, lastName, roleId } = data;

        // 1. Check if user already exists
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('A user with this email address already exists.');
        }

        // 2. Verify role exists and get its name
        const role = await this.db.query.roles.findFirst({
            where: eq(Schema.roles.id, roleId),
        });
        if (!role) {
            throw new NotFoundException('The specified role does not exist.');
        }

        // 3. Get organization details
        const organization = await this.db.query.organization.findFirst({
            where: eq(Schema.organization.id, inviter.organizationId!),
        });
        if (!organization) {
            throw new NotFoundException('Your organization could not be found.');
        }

        // 4. Create user record
        const invitationToken = RandomStringGenerator.generateSecure(OTP_LENGTH, 'numeric');
        const placeholderPassword = await bcrypt.hash(RandomStringGenerator.generateSecure(32), 10);

        const createdUser = await this.db.transaction(async (tx) => {
            const [user] = await tx
                .insert(Schema.user)
                .values({
                    email,
                    firstName,
                    lastName,
                    password: placeholderPassword,
                    isVerified: false,
                    verificationToken: invitationToken,
                    roleId,
                    organizationId: inviter.organizationId,
                })
                .returning();

            await tx.insert(Schema.userSettings).values({
                userId: user.id,
                consent: false,
            });

            return user;
        });

        // 5. Send invitation email
        const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);
        const { url: clientUrl } = configuration.client;
        const invitationUrl = `${clientUrl}/accept-invitation?token=${invitationToken}&email=${encodeURIComponent(email)}`;

        // Fetch inviter details to ensure we have the names (they might be missing from JWT)
        let inviterName = `${inviter.firstName} ${inviter.lastName}`.trim();
        if (!inviter.firstName || !inviter.lastName) {
            const inviterUser = await this.db.query.user.findFirst({
                where: eq(Schema.user.id, inviter.id),
            });
            if (inviterUser) {
                inviterName = `${inviterUser.firstName} ${inviterUser.lastName}`.trim();
            }
        }

        await this.mailService.sendInvitation({
            email,
            firstName,
            lastName,
            organizationName: organization.name,
            inviterName: inviterName || inviter.email,
            roleName: role.name,
            invitationUrl,
        });

        this.logger.log(`User ${email} invited to organization ${organization.name} by ${inviter.email}`);

        return this.findOne(createdUser.id, inviter);
    }


    async updateStatus(id: string, body: UpdateUserStatusDto, requester: JwtUser): Promise<UserSelectOutput> {
        const { status } = body;

        // Rule 1: Cannot deactivate/activate own account
        if (id === requester.id) {
            throw new BadRequestException('You cannot manage your own account status.');
        }

        // Fetch the user to check organization
        const user = await this.db.query.user.findFirst({
            where: eq(Schema.user.id, id),
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        // Rule 2: Must be in the same organization
        if (user.organizationId !== requester.organizationId) {
            throw new ForbiddenException('You do not have permission to manage this user’s status.');
        }

        // Perform the status update
        if (status === 'inactive') {
            return this.softDelete(id);
        } else {
            return this.restore(id);
        }
    }
}


