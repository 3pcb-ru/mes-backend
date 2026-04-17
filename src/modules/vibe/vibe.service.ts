import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { MailService } from '@/app/services/mail/mail.service';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import { user as userSchema } from '@/models/schema/users.schema';
import { vibePages } from '@/models/schema/vibe-pages.schema';
import { VibeProvider } from '@/modules/ai-core/vibe.provider';
import { TraceabilityService } from '@/modules/traceability/traceability.service';
import { JwtUser } from '@/types/jwt.types';
import { TextUtils } from '@/utils/text.utils';

import { CreateVibePageDto, GenerateVibeLayoutDto, UpdateVibePageDto } from './vibe.dto';
import { VibePolicy } from './vibe.policy';

@Injectable()
export class VibeService extends BaseFilterableService {
    constructor(
        private readonly drizzleService: DrizzleService,
        protected readonly filterService: FilterService,
        private readonly vibeProvider: VibeProvider,
        private readonly policy: VibePolicy,
        private readonly mailService: MailService,
        private readonly traceabilityService: TraceabilityService,
    ) {
        super(filterService);
    }

    private get db() {
        return this.drizzleService.database;
    }

    async generateLayout(user: JwtUser, dto: GenerateVibeLayoutDto) {
        // 1. Check for Active Blocks
        const [dbUser] = await this.db.select().from(userSchema).where(eq(userSchema.id, user.id));
        if (!dbUser) throw new NotFoundException('User not found');

        if (dbUser.vibeBlockedUntil && new Date(dbUser.vibeBlockedUntil) > new Date()) {
            const timeLeft = Math.ceil((new Date(dbUser.vibeBlockedUntil).getTime() - new Date().getTime()) / 60000);
            const isPermanent = timeLeft > 1000000; // Far future date
            throw new ForbiddenException(
                isPermanent ? 'AI Agent Access Restricted. Please contact support at info@grvt.cc.' : `Too many failed attempts. Please try again in ${timeLeft} minutes.`,
            );
        }

        // 2. Sanitize and Validate Intent
        const sanitizedPrompt = TextUtils.sanitizeAiPrompt(dto.prompt);
        const intent = await this.vibeProvider.validateIntent(sanitizedPrompt);

        if (!intent.valid) {
            const newFailCount = (dbUser.vibeFailCount || 0) + 1;
            let blockedUntil: Date | null = null;

            // 3-strike rule (10 min block)
            if (newFailCount % 3 === 0) {
                blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
            }

            // Hard lock (20 total abuses)
            if (newFailCount >= 20) {
                blockedUntil = new Date('2099-12-31');
                void this.mailService.sendAiAbuseNotification({
                    email: dbUser.email,
                    name: `${dbUser.firstName} ${dbUser.lastName}`,
                    userId: dbUser.id,
                    organizationId: dbUser.organizationId || 'N/A',
                    timestamp: new Date().toISOString(),
                });
            }

            await this.db
                .update(userSchema)
                .set({
                    vibeFailCount: newFailCount,
                    vibeBlockedUntil: blockedUntil || dbUser.vibeBlockedUntil,
                })
                .where(eq(userSchema.id, user.id));

            throw new ForbiddenException(intent.reason || 'Invalid prompt. Please provide a clear manufacturing UI request.');
        }

        // 3. Success -> Reset counter and generate
        await this.db.update(userSchema).set({ vibeFailCount: 0, vibeBlockedUntil: null }).where(eq(userSchema.id, user.id));

        return this.vibeProvider.generateLayout(sanitizedPrompt, dto.apiManifest, dto.componentsManifest);
    }

    async createPage(user: JwtUser, dto: CreateVibePageDto) {
        const [page] = await this.db
            .insert(vibePages)
            .values({
                name: dto.name,
                category: dto.category,
                config: dto.config,
                isOwnerCreated: dto.isOwnerCreated,
                creatorId: user.id,
                organizationId: user.organizationId!,
            })
            .returning();

        // 4. Record Traceability
        await this.traceabilityService.recordChange(
            {
                entityType: 'VibePage',
                entityId: page.id,
                action: 'INSERT',
                newData: page,
            },
            user,
        );

        return page;
    }

    async updatePage(user: JwtUser, id: string, dto: UpdateVibePageDto) {
        const [page] = await this.db.select().from(vibePages).where(eq(vibePages.id, id));

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        if (!this.policy.canWriteRecord(user, page)) {
            throw new ForbiddenException('You do not have permission to update this page');
        }

        const [updatedPage] = await this.db
            .update(vibePages)
            .set({
                ...dto,
                // Ensure creator/org cannot be changed
                creatorId: page.creatorId,
                organizationId: page.organizationId,
            })
            .where(eq(vibePages.id, id))
            .returning();

        // 4. Record Traceability
        await this.traceabilityService.recordChange(
            {
                entityType: 'VibePage',
                entityId: updatedPage.id,
                action: 'UPDATE',
                oldData: page,
                newData: updatedPage,
            },
            user,
        );

        return updatedPage;
    }

    async getPages(user: JwtUser) {
        // Logic: Get pages created by user OR owner-created pages in the same org
        // For simplicity in this demo, we'll fetch all and filter via policy or use a combined query
        const allPages = await this.db.select().from(vibePages).where(eq(vibePages.organizationId, user.organizationId!));

        return allPages.filter((p) => this.policy.canReadRecord(user, p));
    }

    async deletePage(user: JwtUser, id: string) {
        const [page] = await this.db.select().from(vibePages).where(eq(vibePages.id, id));

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        if (!this.policy.canWriteRecord(user, page)) {
            throw new ForbiddenException('You do not have permission to delete this page');
        }

        await this.db.delete(vibePages).where(eq(vibePages.id, id));

        // Record Traceability
        await this.traceabilityService.recordChange(
            {
                entityType: 'VibePage',
                entityId: id,
                action: 'DELETE',
                oldData: page,
            },
            user,
        );

        return { success: true };
    }
}
