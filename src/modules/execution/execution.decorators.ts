import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

export const ExecutionDecorators = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.execution.Read),
            ApiOperation({ summary: 'List all running jobs (mock)' }),
            ApiResponse({ status: 200, description: 'Jobs fetched successfully' }),
        ),

    get: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.execution.Read),
            ApiOperation({ summary: 'Get job status by ID (mock)' }),
            ApiResponse({ status: 200, description: 'Job fetched successfully' }),
            ApiResponse({ status: 404, description: 'Job not found' }),
        ),

    create: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.execution.Write),
            ApiOperation({ summary: 'Submit a new job to execution (mock)' }),
            ApiResponse({ status: 201, description: 'Job created successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),
};
