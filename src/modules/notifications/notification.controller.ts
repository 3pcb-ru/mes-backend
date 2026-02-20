import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { NotificationService } from './notification.service';
import { NotificationsDecorators } from './notifications.decorators';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get()
    @NotificationsDecorators('list')
    async list(@Query() query: PaginatedFilterQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.notificationService.list(user, query);
        return ok(result.data).paginate({
            total: result.total,
            page: result.page,
            limit: result.limit,
        });
    }

    @Patch('read-all')
    @NotificationsDecorators('markAllAsRead')
    async markAllAsRead(@CurrentUser() user: JwtUser) {
        const result = await this.notificationService.markAllAsRead(user);
        return ok(result).message('All notifications marked as read');
    }

    @Patch(':id/read')
    @NotificationsDecorators('markAsRead')
    async markAsRead(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        const result = await this.notificationService.markAsRead(user, id);
        return ok(result).message('Notification marked as read');
    }

    @Delete(':id')
    @NotificationsDecorators('delete')
    async delete(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        const result = await this.notificationService.delete(user, id);
        return ok(result).message('Notification deleted successfully');
    }
}
