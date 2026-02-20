import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ErrorResponseDto } from '@/common/dto/error.dto';
import { Permissions } from '@/common/permissions';

import { RequiresPermissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { NotificationApiResponseDto, NotificationPaginatedApiResponseDto } from './notification.dto';

export const notificationsEndpointConfig = {
    list: () =>
        applyDecorators(
            ApiTags('Notifications'),
            ApiBearerAuth(),
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.notifications.Read),
            ApiOperation({ summary: 'List user notifications' }),
            ZodResponse({ status: 200, type: NotificationPaginatedApiResponseDto, description: 'Returns list of notifications' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),
    markAsRead: () =>
        applyDecorators(
            ApiTags('Notifications'),
            ApiBearerAuth(),
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.notifications.Update),
            ApiOperation({ summary: 'Mark a notification as read' }),
            ZodResponse({ status: 200, type: NotificationApiResponseDto, description: 'Returns updated notification' }),
            ApiResponse({ status: 400, description: 'Invalid payload', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'Notification not found', type: ErrorResponseDto }),
        ),
    markAllAsRead: () =>
        applyDecorators(
            ApiTags('Notifications'),
            ApiBearerAuth(),
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.notifications.Update),
            ApiOperation({ summary: 'Mark all user notifications as read' }),
            ZodResponse({ status: 200, type: NotificationApiResponseDto, description: 'Returns success status' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),
    delete: () =>
        applyDecorators(
            ApiTags('Notifications'),
            ApiBearerAuth(),
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.notifications.Delete),
            ApiOperation({ summary: 'Delete a notification' }),
            ZodResponse({ status: 200, type: NotificationApiResponseDto, description: 'Returns deleted notification' }),
            ApiResponse({ status: 404, description: 'Notification not found', type: ErrorResponseDto }),
        ),
} as const;

export type NotificationsEndpointKey = keyof typeof notificationsEndpointConfig;

export function NotificationsDecorators(endpoint: NotificationsEndpointKey) {
    return notificationsEndpointConfig[endpoint]();
}
