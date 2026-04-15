import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

import { ActivityDetailResponseDto, ActivityListResponseDto } from './traceability.dto';

export const TraceabilityDecorators = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.traceability.Read),
            ApiOperation({ summary: 'List all activities' }),
            ZodResponse({ status: 200, type: ActivityListResponseDto }),
        ),

    getById: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.traceability.Read),
            ApiOperation({ summary: 'Get activity by ID' }),
            ZodResponse({ status: 200, type: ActivityDetailResponseDto }),
            ApiResponse({ status: 404, description: 'Activity not found' }),
        ),

    create: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.traceability.Write),
            ApiOperation({ summary: 'Create a new activity' }),
            ZodResponse({ status: 201, type: ActivityDetailResponseDto }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),
};
