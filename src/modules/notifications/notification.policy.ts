import { Injectable } from '@nestjs/common';

import { BasePolicy } from '@/common/base.policy';
import { notifications as notificationSchema } from '@/models/schema/notifications.schema';

@Injectable()
export class NotificationsPolicy extends BasePolicy<typeof notificationSchema> {
    constructor() {
        super({
            table: notificationSchema,
            resource: 'notifications',
            owner: (t) => t.userId,
        });
    }
}
