import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Permissions } from '@/common/permissions';

import { RequiresPermissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import {
    AssignRoleApiResponseDto,
    PermissionsListApiResponseDto,
    RoleApiResponseDto,
    RolePaginatedApiResponseDto,
    RoleWithPermissionsApiResponseDTO,
    RoleWithPermissionsLookupApiResponseDTO,
    BooleanApiResponseDto,
} from './roles.dto';

const rolesEndpointConfig = {
    create: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Write),
            ApiOperation({ summary: 'Create role with permissions' }),
            ZodResponse({ status: 200, type: RoleApiResponseDto }),
        ),
    lookup: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Read),
            ApiOperation({
                summary: 'Lookup roles with permissions',
            }),
            ZodResponse({ status: 200, type: RoleWithPermissionsLookupApiResponseDTO }),
        ),
    findOne: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Read),
            ZodResponse({ status: 200, type: RoleWithPermissionsApiResponseDTO }),
            ApiOperation({
                summary: 'Get role with permissions',
            }),
        ),
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Read),
            ZodResponse({ status: 200, type: RolePaginatedApiResponseDto }),
            ApiOperation({
                summary: 'List roles',
            }),
        ),
    assign: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Change),
            ApiOperation({ summary: 'Assign role to a user' }),
            ZodResponse({ status: 200, type: AssignRoleApiResponseDto }),
        ),
    'all-permissions': () =>
        applyDecorators(
            UseGuards(JwtAuthGuard),
            ZodResponse({ status: 200, type: PermissionsListApiResponseDto }),
            ApiOperation({
                summary: 'Get all permissions',
            }),
        ),
    'update-permissions': () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.ChangePermissions),
            ApiOperation({ summary: 'Update role permissions' }),
            ZodResponse({ status: 200, type: BooleanApiResponseDto }),
        ),
    'update-details': () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Update),
            ApiOperation({ summary: 'Update role details' }),
            ZodResponse({ status: 200, type: RoleApiResponseDto }),
        ),
    duplicate: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Write),
            ApiOperation({ summary: 'Duplicate an existing role (System or Custom)' }),
            ZodResponse({ status: 201, type: RoleApiResponseDto }),
        ),
    delete: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.roles.Delete),
            ApiOperation({ summary: 'Delete a custom role' }),
            ZodResponse({ status: 200, type: BooleanApiResponseDto }),
        ),
} as const;

export type RolesEndpointKey = keyof typeof rolesEndpointConfig;

export function RolesDecorators(endpoint: RolesEndpointKey) {
    return rolesEndpointConfig[endpoint]();
}
