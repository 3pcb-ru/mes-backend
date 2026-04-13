import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ErrorResponseDto } from '@/common/dto/error.dto';
import { Permissions } from '@/common/permissions';

import { RequiresPermissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { UserApiResponseDto, UserPaginatedApiResponseDto } from './users.dto';

const usersEndpointConfig = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.users.Read),
            ApiOperation({ summary: 'List users' }),
            ZodResponse({ status: 200, type: UserPaginatedApiResponseDto }),
        ),

    profileSelf: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard),
            ApiOperation({ summary: 'Get current user profile' }),
            ZodResponse({ status: 200, type: UserApiResponseDto, description: 'User profile fetched successfully' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),

    findOne: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.users.Read),
            ApiOperation({ summary: 'Get user profile by ID' }),
            ZodResponse({ status: 200, type: UserApiResponseDto, description: 'User profile fetched successfully' }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 403, description: 'Can only view own profile', type: ErrorResponseDto }),
        ),

    updateProfile: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.users.Update),
            ApiOperation({ summary: 'Update user profile' }),
            ZodResponse({ status: 200, type: UserApiResponseDto, description: 'Profile updated successfully' }),
            ApiResponse({ status: 400, description: 'Bad request - validation failed', type: ErrorResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 403, description: 'Can only update own profile', type: ErrorResponseDto }),
        ),
    invite: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.users.Write),
            ApiOperation({ summary: 'Invite a new user to the organization' }),
            ZodResponse({ status: 201, description: 'Invitation sent successfully', type: UserApiResponseDto }),
            ApiResponse({ status: 400, description: 'Bad request - validation failed', type: ErrorResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 403, description: 'No permission to invite users', type: ErrorResponseDto }),
            ApiResponse({ status: 409, description: 'User already exists', type: ErrorResponseDto }),
        ),
    updateStatus: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.users.Update),
            ApiOperation({ summary: 'Update user status (active/inactive)' }),
            ZodResponse({ status: 200, type: UserApiResponseDto, description: 'Status updated successfully' }),
            ApiResponse({ status: 400, description: 'Cannot manage own status', type: ErrorResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 403, description: 'No permission to manage user status', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto }),
        ),
    deactivate: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.users.Delete),
            ApiOperation({ summary: 'Deactivate a user account' }),
            ZodResponse({ status: 200, type: UserApiResponseDto, description: 'User deactivated successfully' }),
            ApiResponse({ status: 400, description: 'Cannot deactivate own account', type: ErrorResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 403, description: 'No permission to deactivate user', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto }),
        ),
} as const;


export type UsersEndpointKey = keyof typeof usersEndpointConfig;

export function UsersDecorators(endpoint: UsersEndpointKey) {
    return usersEndpointConfig[endpoint]();
}
