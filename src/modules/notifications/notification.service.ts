import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { NOTIFICATION_STATUS } from '@/common/enums';
import { FilterService } from '@/common/services/filter.service';
import { FilterableQueryBuilder } from '@/common/services/filterable-query.builder';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { NotificationSelectOutput } from '@/models/zod-schemas';
import { JwtUser } from '@/types/jwt.types';

import { NotificationsPolicy } from './notification.policy';

@Injectable()
export class NotificationService {
    constructor(
        private readonly db: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly notificationsPolicy: NotificationsPolicy,
        private readonly filterService: FilterService,
    ) {
        this.logger.setContext(NotificationService.name);
    }

    async list(user: JwtUser, query: PaginatedFilterQueryDto) {
        const policyWhere = await this.notificationsPolicy.read(user);

        const builder = new FilterableQueryBuilder(this.db.database, Schema.notifications, this.filterService)
            .filter(query)
            .where(policyWhere)
            .paginate(query)
            .orderByFromQuery(query, 'createdAt');

        return builder.select();
    }

    async markAsRead(user: JwtUser, id: string): Promise<NotificationSelectOutput> {
        const policyWhere = await this.notificationsPolicy.update(user, eq(Schema.notifications.id, id));

        const [updated] = await this.db.database
            .update(Schema.notifications)
            .set({
                status: NOTIFICATION_STATUS.READ,
                readAt: new Date(),
                updatedAt: new Date(),
            })
            .where(policyWhere)
            .returning();

        if (!updated) {
            throw new NotFoundException('Notification not found or access denied');
        }

        return { ...updated, data: updated.data as JSON };
    }

    async markAllAsRead(user: JwtUser) {
        await this.db.database
            .update(Schema.notifications)
            .set({
                status: NOTIFICATION_STATUS.READ,
                readAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(eq(Schema.notifications.userId, user.id), eq(Schema.notifications.status, 'unread')));

        return { success: true };
    }

    async delete(user: JwtUser, id: string): Promise<NotificationSelectOutput> {
        const policyWhere = await this.notificationsPolicy.delete(user, eq(Schema.notifications.id, id));

        const [deleted] = await this.db.database.delete(Schema.notifications).where(policyWhere).returning();

        if (!deleted) {
            throw new NotFoundException('Notification not found or access denied');
        }

        return { ...deleted, data: deleted.data as JSON };
    }
}
