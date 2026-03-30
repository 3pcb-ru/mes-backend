import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { AttachmentService } from '../attachments/attachment.service';
import { UpdateOrganizationDto } from './organization.dto';
import { JwtUser } from '@/types/jwt.types';

@Injectable()
export class OrganizationService {
    private db;

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly attachmentService: AttachmentService,
    ) {
        this.db = this.drizzle.database;
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

        return updatedOrg;
    }

    async findOne(id: string) {
        const [org] = await this.db
            .select()
            .from(Schema.organization)
            .where(eq(Schema.organization.id, id))
            .limit(1);
        
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        
        return org;
    }
}
