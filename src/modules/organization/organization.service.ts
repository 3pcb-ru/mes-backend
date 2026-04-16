import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { JwtUser } from '@/types/jwt.types';

import { AttachmentService } from '../attachments/attachment.service';
import { SetupService } from '../node/setup.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './organization.dto';

@Injectable()
export class OrganizationService {
    private db;

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly attachmentService: AttachmentService,
        private readonly setupService: SetupService,
    ) {
        this.db = this.drizzle.database;
    }

    async create(data: CreateOrganizationDto, user: JwtUser) {
        const organizationRecord = await this.db.transaction(async (tx) => {
            // 1. Create the organization
            const [org] = await tx
                .insert(Schema.organization)
                .values({
                    name: data.name,
                    timezone: data.timezone ?? 'UTC',
                })
                .returning();

            // 2. Link the user to the organization
            await tx.update(Schema.user).set({ organizationId: org.id }).where(eq(Schema.user.id, user.id));

            // 3. Create default setup (nodes, etc.)
            await this.setupService.createDefaultSetup(tx, org.id, data.name);

            return org;
        });

        return organizationRecord;
    }

    async update(organizationId: string, data: UpdateOrganizationDto, user: JwtUser) {
        // 1. If logoId is provided, validate it
        if (data.logoId) {
            try {
                const attachment = await this.attachmentService.findOne(data.logoId, user);
                if (!attachment.isUploaded) {
                    throw new BadRequestException('The provided logo file has not been fully uploaded yet.');
                }
                // Optional: Check if it's an image
                if (!attachment.mimeType.startsWith('image/')) {
                    throw new BadRequestException('Organization logo must be an image file.');
                }
            } catch (error) {
                if (error instanceof NotFoundException) {
                    throw new BadRequestException('The provided logoId does not exist or you do not have permission to use it.');
                }
                throw error;
            }
        }

        // 2. Perform the update
        const [updatedOrg] = await this.db
            .update(Schema.organization)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(Schema.organization.id, organizationId))
            .returning({
                id: Schema.organization.id,
                name: Schema.organization.name,
                timezone: Schema.organization.timezone,
                logoId: Schema.organization.logoId,
                createdAt: Schema.organization.createdAt,
                updatedAt: Schema.organization.updatedAt,
            });

        if (!updatedOrg) {
            throw new NotFoundException('Organization not found');
        }

        // Populate logoUrl if logoId exists
        if (updatedOrg.logoId) {
            const logo = await this.db.query.attachments.findFirst({
                where: and(eq(Schema.attachments.id, updatedOrg.logoId), eq(Schema.attachments.isUploaded, true)),
            });

            if (logo) {
                const objectPath = this.attachmentService.getObjectPath(logo.userId, logo.id, logo.fileName);
                (updatedOrg as any).logoUrl = await this.attachmentService['storageService'].presignedGetObject(objectPath);
            }
        }

        return updatedOrg;
    }

    async findOne(id: string) {
        const [org] = await this.db.select().from(Schema.organization).where(eq(Schema.organization.id, id)).limit(1);

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        return org;
    }
}
