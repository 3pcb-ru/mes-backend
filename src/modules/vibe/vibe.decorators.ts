import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ErrorResponseDto } from '@/common/dto/error.dto';
import { Permissions } from '@/common/permissions';

import { RequiresPermissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';

const vibeEndpointConfig = {
    generateLayout: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.vibe.Write),
            ApiOperation({ summary: 'Generate AI layout based on prompt' }),
            ApiResponse({ status: 200, description: 'Layout generated successfully' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 403, description: 'Forbidden - Usage limits or invalid intent', type: ErrorResponseDto }),
        ),

    createPage: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.vibe.Write),
            ApiOperation({ summary: 'Create a new Vibe page' }),
            ApiResponse({ status: 201, description: 'Vibe page created successfully' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),

    getPages: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.vibe.Read),
            ApiOperation({ summary: 'Get accessible Vibe pages' }),
            ApiResponse({ status: 200, description: 'Vibe pages retrieved successfully' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),

    updatePage: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.vibe.Write),
            ApiOperation({ summary: 'Update a Vibe page' }),
            ApiResponse({ status: 200, description: 'Vibe page updated successfully' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'Page not found', type: ErrorResponseDto }),
        ),

    deletePage: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.vibe.Delete),
            ApiOperation({ summary: 'Delete a Vibe page' }),
            ApiResponse({ status: 200, description: 'Vibe page deleted successfully' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'Page not found', type: ErrorResponseDto }),
        ),
} as const;

export type VibeEndpointKey = keyof typeof vibeEndpointConfig;

export function VibeDecorators(endpoint: VibeEndpointKey) {
    return vibeEndpointConfig[endpoint]();
}
