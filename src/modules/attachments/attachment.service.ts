import { eq, and, isNull, lte, inArray } from 'drizzle-orm';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { StorageService } from '@/app/services/storage/storage.service';
import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { MIME_TYPE } from '@/app/services/storage/storage.interface';
import { AVATAR_EXPIRY, DEFAULT_EXPIRY } from '@/common/constants';
import { DrizzleService } from '@/models/model.service';

import * as Schema from '@/models/schema/attachments.schema';
import { messageAttachments } from '@/models/schema/ticket-messages.schema';
import type { Pagination } from '@/types';
import type { AttachmentSelectOutput } from '@/models/zod-schemas';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { JwtUser } from '@/types/jwt.types';
import { AttachmentsPolicy } from './attachment.policy';
import { FILE_TYPE } from '@/common/enums';
import { DrizzleTransaction } from '@/models/model.types';

@Injectable()
export class AttachmentService extends BaseFilterableService {
    private db;
    private attachmentsPolicy = new AttachmentsPolicy();

    constructor(
        private readonly storageService: StorageService,
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(AttachmentService.name);
        this.db = this.drizzle.database;
    }

    getObjectPath(userId: string, attachmentId: string, fileName: string) {
        const objectName = `${userId}/${attachmentId}/${fileName}`;
        return objectName;
    }

    async findOne(attachmentId: string, user: JwtUser) {
        const policyWhere = await this.attachmentsPolicy.read(
            user,
            isNull(Schema.attachments.deletedAt),
            eq(Schema.attachments.isUploaded, true),
            eq(Schema.attachments.id, attachmentId),
        );
        const attachment = await this.db.query.attachments.findFirst({
            where: policyWhere,
        });

        if (!attachment) {
            throw new NotFoundException(`Attachment not found, or you dont have permision for id: ${attachmentId}`);
        }

        return attachment;
    }

    async createAttachment(user: JwtUser, fileName: string, mimeType: MIME_TYPE, type: FILE_TYPE): Promise<{ attachmentId: string; url: string; expiresAt: Date }> {
        await this.attachmentsPolicy.canWrite(user);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        const newAttachment = {
            fileName,
            userId: user.id,
            mimeType,
            type,
            expiresAt,
        };
        try {
            const [attachment] = await this.db.insert(Schema.attachments).values(newAttachment).returning();

            const path = this.getObjectPath(user.id, attachment.id, attachment.fileName);
            const url = await this.storageService.presignedPutObject(mimeType, path);

            return {
                attachmentId: attachment.id,
                url,
                expiresAt,
            };
        } catch (error) {
            this.logger.error(error);
            throw new BadRequestException(error.cause ?? 'Attachment upload failed! please use proper input and try again!');
        }
    }

    async confirmUpload(attachmentId: string | string[], tx?: DrizzleTransaction) {
        const db = tx ?? this.db;

        if (Array.isArray(attachmentId)) {
            const attachments = await db
                .update(Schema.attachments)
                .set({
                    isUploaded: true,
                    expiresAt: null,
                })
                .where(inArray(Schema.attachments.id, attachmentId))
                .returning();
            if (!attachments.length) throw new NotFoundException('Attachments not found');
            return attachments;
        } else {
            const [attachment] = await db
                .update(Schema.attachments)
                .set({
                    isUploaded: true,
                    expiresAt: null,
                })
                .where(eq(Schema.attachments.id, attachmentId))
                .returning();
            if (!attachment) throw new NotFoundException('Attachment not found');
            return attachment;
        }
    }

    async getDownloadUrl(attachmentId: string, user: JwtUser): Promise<{ url: string; attachment: AttachmentSelectOutput }> {
        const url = await this.getValidPresignedUrl(attachmentId, user);
        const attachment = await this.findOne(attachmentId, user);

        return {
            url,
            attachment,
        };
    }

    /**
     * Returns a valid presigned URL for an attachment, caching it in the database.
     * Renews the URL if it's nearing expiry or doesn't exist.
     */
    async getValidPresignedUrl(attachmentId: string, user: JwtUser): Promise<string> {
        const attachment = await this.findOne(attachmentId, user);

        // Determine expiry based on type
        const isPublicAsset = attachment.type === FILE_TYPE.USER_AVATAR || attachment.type === FILE_TYPE.ORGANIZATION_LOGO;
        const expiryInSeconds = isPublicAsset ? AVATAR_EXPIRY : DEFAULT_EXPIRY;

        const now = new Date();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        // If we have a cached URL that's still valid, return it
        if (attachment.url && attachment.urlExpiresAt && new Date(attachment.urlExpiresAt).getTime() > now.getTime() + bufferTime) {
            return attachment.url;
        }

        // Generate a new URL
        const objectName = this.getObjectPath(attachment.userId, attachment.id, attachment.fileName);
        const newUrl = await this.storageService.presignedGetObject(objectName, expiryInSeconds);

        // Calculate new expiration date
        const newUrlExpiresAt = new Date(now.getTime() + expiryInSeconds * 1000);

        // Update the cache in DB
        await this.db
            .update(Schema.attachments)
            .set({
                url: newUrl,
                urlExpiresAt: newUrlExpiresAt,
                updatedAt: now,
            })
            .where(eq(Schema.attachments.id, attachment.id));

        return newUrl;
    }

    async list(user: JwtUser, query: PaginatedFilterQueryDto): Promise<{ data: AttachmentSelectOutput[] } & Pagination> {
        const policyWhere = await this.attachmentsPolicy.read(user, isNull(Schema.attachments.deletedAt), eq(Schema.attachments.isUploaded, true));

        const result = await this.filterable(this.db, Schema.attachments, {
            defaultSortColumn: 'createdAt',
        })
            .uniqueOn(Schema.attachments.id)
            .join(messageAttachments, eq(messageAttachments.attachmentId, Schema.attachments.id))
            .where(policyWhere)
            .where(isNull(messageAttachments.attachmentId))
            .filter(query)
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .select();

        return result;
    }

    async myFiles(user: JwtUser, query: PaginatedFilterQueryDto): Promise<{ data: AttachmentSelectOutput[] } & Pagination> {
        const policyWhere = await this.attachmentsPolicy.read(
            user,
            isNull(Schema.attachments.deletedAt),
            eq(Schema.attachments.isUploaded, true),
            eq(Schema.attachments.userId, user.id),
        );

        const result = await this.filterable(this.db, Schema.attachments, {
            defaultSortColumn: 'createdAt',
        })
            .uniqueOn(Schema.attachments.id)
            .join(messageAttachments, eq(messageAttachments.attachmentId, Schema.attachments.id))
            .where(policyWhere)
            .where(isNull(messageAttachments.attachmentId))
            .filter(query)
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .select();

        return result;
    }

    async delete(user: JwtUser, attachmentId: string) {
        const policyWhere = await this.attachmentsPolicy.delete(user, eq(Schema.attachments.id, attachmentId));
        const attachment = await this.db.query.attachments.findFirst({
            where: policyWhere,
        });
        if (!attachment) {
            throw new NotFoundException(`Attachment ${attachmentId} cannot be found for current user`);
        }


        const [result] = await this.db.delete(Schema.attachments).where(eq(Schema.attachments.id, attachmentId)).returning();

        if (!result) {
            throw new InternalServerErrorException('Failed to delete attachment');
        }

        const objectName = `${attachment.userId}/${attachment.id}/${attachment.fileName}`;
        await this.storageService.deleteObject(objectName);

        return result;
    }


    async getThumbnailStream(attachmentId: string, user: JwtUser) {
        const attachment = await this.findOne(attachmentId, user);

        if (!attachment.mimeType?.startsWith('image/')) {
            throw new NotFoundException();
        }

        const objectPath = this.getObjectPath(attachment.userId, attachmentId, attachment.fileName);

        const stream = await this.storageService.getObjectStream(objectPath);

        return {
            stream,
            attachment,
        };
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupUnusedAttachments() {
        try {
            const now = new Date();

            // Find expired attachments
            const expiredAttachments = await this.db.query.attachments.findMany({
                where: and(eq(Schema.attachments.isUploaded, false), lte(Schema.attachments.expiresAt, now), isNull(Schema.attachments.deletedAt)),
            });

            for (const attachment of expiredAttachments) {
                // Hard delete in DB
                await this.db.delete(Schema.attachments).where(eq(Schema.attachments.id, attachment.id));

                // Delete from storage
                const objectName = `${attachment.userId}/${attachment.id}/${attachment.fileName}`;
                try {
                    await this.storageService.deleteObject(objectName);
                } catch (error) {
                    this.logger.error(`Failed to delete file ${objectName}:`, error);
                }
            }

            if (expiredAttachments.length > 0) {
                this.logger.log(`Cleaned up ${expiredAttachments.length} unused attachments`);
            }
        } catch (error) {
            this.logger.error('Failed to cleanup unused attachments:', error);
        }
    }
}
