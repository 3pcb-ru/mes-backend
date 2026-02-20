import { Module } from '@nestjs/common';

import { FilterService } from '@/common/services/filter.service';

import { NotificationController } from './notification.controller';
import { NotificationsPolicy } from './notification.policy';
import { NotificationService } from './notification.service';

@Module({
    controllers: [NotificationController],
    providers: [NotificationService, NotificationsPolicy, FilterService],
    exports: [NotificationService],
})
export class NotificationModule {}
