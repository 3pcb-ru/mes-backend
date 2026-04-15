import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

import { ExecutionDetailResponseDto, ExecutionListResponseDto } from './execution.dto';

export const ExecutionDecorators = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.execution.Read),
            ApiOperation({ summary: 'List all running jobs' }),
            ZodResponse({ status: 200, type: ExecutionListResponseDto }),
        ),

    get: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.execution.Read),
            ApiOperation({ summary: 'Get job status by ID' }),
            ZodResponse({ status: 200, type: ExecutionDetailResponseDto }),
            ApiResponse({ status: 404, description: 'Job not found' }),
        ),
};
