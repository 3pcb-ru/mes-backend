import { ApiProperty } from '@nestjs/swagger';
import z from 'zod';

import { DEFAULT_CHAR_LENGTH } from '@/common/constants';
import { createApiPaginatedResponseDto, createApiResponseDto } from '@/common/helpers/api-response';
import { createStrictZodDto } from '@/common/helpers/zod-strict';
import { permissionSelectSchema, roleSelectSchema, roleUpdateSchema, userSelectSchema } from '@/models/zod-schemas';

//Input Schemas
export const updateRolePermissionsSchema = z.object({
    permissionIds: z.array(z.string().nullable()).transform((val) => val.filter((v): v is string => v !== null)),
});

export const updateRoleDetailsSchema = roleUpdateSchema.pick({
    name: true,
    description: true,
});

export const createRoleSchema = z.object({
    name: z.string().min(3).max(20),
    description: z.string().min(10).max(DEFAULT_CHAR_LENGTH),
});

export const assignRoleSchema = z.object({
    roleId: z.string(),
    userId: z.string(),
});

//Output Schemas
export const roleWithPermissionsListResponseSchema = roleSelectSchema.extend({
    permissions: z.array(
        permissionSelectSchema.pick({
            name: true,
            description: true,
        }),
    ),
});

// Input DTO's
export class UpdateRolePermissionsDto extends createStrictZodDto(updateRolePermissionsSchema) {
    @ApiProperty({ description: 'List of permission UUIDs to assign to the role', example: ['uuid-1', 'uuid-2'] })
    permissionIds: string[];
}

export class UpdateRoleDetailsDto extends createStrictZodDto(updateRoleDetailsSchema) {
    @ApiProperty({ description: 'New name for the role', example: 'Supervisor', required: false })
    name?: string;

    @ApiProperty({ description: 'New description for the role', example: 'Oversees line operations', required: false })
    description?: string;
}

export class CreateRoleDto extends createStrictZodDto(createRoleSchema) {
    @ApiProperty({ description: 'Name of the new role', example: 'Supervisor' })
    name: string;

    @ApiProperty({ description: 'Description of the new role', example: 'Oversees line operations' })
    description: string;
}

export class AssignRoleDto extends createStrictZodDto(assignRoleSchema) {
    @ApiProperty({ description: 'ID of the role to assign' })
    roleId: string;

    @ApiProperty({ description: 'ID of the user to assign the role to' })
    userId: string;
}

//Response Data Shapes
export class RoleResponseDto {
    @ApiProperty({ description: 'Unique role ID' })
    id: string;

    @ApiProperty({ description: 'Role name', example: 'Supervisor' })
    name: string;

    @ApiProperty({ description: 'Role description', required: false })
    description: string | null;

    @ApiProperty({ description: 'Organization ID this role belongs to', required: false })
    organizationId: string | null;

    @ApiProperty({ description: 'Whether this is a default role', required: false })
    isDefault: boolean | null;

    @ApiProperty({ description: 'Whether this is an admin role', required: false })
    isAdmin: boolean | null;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: Date;

    @ApiProperty({ description: 'Deletion timestamp', required: false })
    deletedAt: Date | null;
}

export class RoleWithPermissionsResponseDto extends RoleResponseDto {
    @ApiProperty({ description: 'List of permissions assigned to this role' })
    permissions: any[];
}

//Response DTO
export class RoleApiResponseDto extends createApiResponseDto(roleSelectSchema) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Role retrieved successfully' })
    message: string;

    @ApiProperty({ type: RoleResponseDto })
    data: RoleResponseDto;
}

export class RoleWithPermissionsApiResponseDTO extends createApiResponseDto(roleWithPermissionsListResponseSchema) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Role with permissions retrieved successfully' })
    message: string;

    @ApiProperty({ type: RoleWithPermissionsResponseDto })
    data: RoleWithPermissionsResponseDto;
}

export class RoleWithPermissionsLookupApiResponseDTO extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Roles retrieved successfully' })
    message: string;

    @ApiProperty({ type: [RoleWithPermissionsResponseDto] })
    data: RoleWithPermissionsResponseDto[];
}

export class RolePaginatedApiResponseDto extends createApiPaginatedResponseDto(roleSelectSchema) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Roles retrieved successfully' })
    message: string;

    @ApiProperty({ type: [RoleResponseDto] })
    data: RoleResponseDto[];

    @ApiProperty()
    pagination: any;
}

export class PermissionsListApiResponseDto extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Permissions retrieved successfully' })
    message: string;

    @ApiProperty({ type: [Object] })
    data: any[];
}

export class BooleanApiResponseDto extends createApiResponseDto(z.boolean()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Operation successful' })
    message: string;

    @ApiProperty({ example: true })
    data: boolean;
}

export class AssignRoleApiResponseDto extends createApiResponseDto(userSelectSchema) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Role assigned successfully' })
    message: string;

    @ApiProperty({ description: 'Updated user details' })
    data: any;
}
