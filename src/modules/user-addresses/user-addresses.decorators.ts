import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

import { ErrorResponseDto } from '@/common/dto/error.dto';
import { AddressApiResponseDto, AddressPaginatedApiResponseDto } from './user-addresses.dto';

const userAddressesEndpointConfig = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.user_addresses.Read),
            ApiOperation({ summary: 'Get all user addresses' }),
            ZodResponse({ status: 200, type: AddressPaginatedApiResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),

    findOne: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.user_addresses.Read),
            ApiOperation({ summary: 'Get user address by id' }),
            ZodResponse({ status: 200, type: AddressApiResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),

    create: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.user_addresses.Write),
            ApiOperation({ summary: 'Create a new address' }),
            ZodResponse({ status: 200, type: AddressApiResponseDto }),
            ApiResponse({ status: 400, description: 'Bad request - validation failed', type: ErrorResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
        ),

    update: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.user_addresses.Update),
            ApiOperation({ summary: 'Update an address' }),
            ZodResponse({ type: AddressApiResponseDto }),
            ApiResponse({ status: 400, description: 'Bad request - validation failed', type: ErrorResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'Address not found', type: ErrorResponseDto }),
        ),

    setDefault: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.user_addresses.Update),
            ApiOperation({ summary: 'Set address as default' }),
            ZodResponse({ type: AddressApiResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'Address not found', type: ErrorResponseDto }),
        ),

    remove: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.user_addresses.Delete),
            ApiOperation({ summary: 'Delete an address' }),
            ZodResponse({ type: AddressApiResponseDto }),
            ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto }),
            ApiResponse({ status: 404, description: 'Address not found', type: ErrorResponseDto }),
        ),
} as const;

export type UserAddressesEndpointKey = keyof typeof userAddressesEndpointConfig;
export function UserAddressesDecorators(endpoint: UserAddressesEndpointKey) {
    return userAddressesEndpointConfig[endpoint]();
}
