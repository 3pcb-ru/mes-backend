import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

export const TraceabilityDecorators = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.traceability.Read),
            ApiOperation({ summary: 'List all activities' }),
            ApiResponse({ status: 200, description: 'Activities fetched successfully' }),
        ),

    getById: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.traceability.Read),
            ApiOperation({ summary: 'Get activity by ID' }),
            ApiResponse({ status: 200, description: 'Activity fetched successfully' }),
            ApiResponse({ status: 404, description: 'Activity not found' }),
        ),

    create: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.traceability.Write),
            ApiOperation({ summary: 'Create a new activity' }),
            ApiResponse({ status: 201, description: 'Activity created successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),
};
