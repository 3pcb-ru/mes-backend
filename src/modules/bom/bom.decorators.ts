import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

import { BomMaterialDetailResponseDto, BomMaterialListResponseDto, BomRevisionDetailResponseDto, BomRevisionListResponseDto } from './bom.dto';

export const BomDecorators = {
    // --- Revisions ---
    getRevisions: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Read),
            ApiOperation({ summary: 'List all revisions for a product' }),
            ZodResponse({ status: 200, type: BomRevisionListResponseDto }),
        ),

    createRevision: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Write),
            ApiOperation({ summary: 'Create a new major revision' }),
            ZodResponse({ status: 201, type: BomRevisionDetailResponseDto }),
        ),

    createAlternative: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Write),
            ApiOperation({ summary: 'Create an alternative (minor) revision' }),
            ZodResponse({ status: 201, type: BomRevisionDetailResponseDto }),
        ),

    updateRevision: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Update),
            ApiOperation({ summary: 'Update revision version (Draft only)' }),
            ZodResponse({ status: 200, type: BomRevisionDetailResponseDto }),
        ),

    deleteRevision: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Delete),
            ApiOperation({ summary: 'Delete revision' }),
            ApiResponse({ status: 200, description: 'Revision deleted' }),
        ),

    submitRevision: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Update),
            ApiOperation({ summary: 'Submit revision for approval' }),
            ApiResponse({ status: 200, description: 'Revision submitted' }),
        ),

    approveRevision: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Update),
            ApiOperation({ summary: 'Approve revision' }),
            ApiResponse({ status: 200, description: 'Revision approved' }),
        ),

    activateRevision: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Update),
            ApiOperation({ summary: 'Activate revision' }),
            ApiResponse({ status: 200, description: 'Revision activated' }),
        ),

    // --- Materials ---
    getMaterials: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Read),
            ApiOperation({ summary: 'List all materials for a revision' }),
            ZodResponse({ status: 200, type: BomMaterialListResponseDto }),
        ),

    addMaterial: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Update),
            ApiOperation({ summary: 'Add a material to a revision (Draft only)' }),
            ZodResponse({ status: 201, type: BomMaterialDetailResponseDto }),
        ),

    updateMaterial: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Update),
            ApiOperation({ summary: 'Update material (Draft only)' }),
            ZodResponse({ status: 200, type: BomMaterialDetailResponseDto }),
        ),

    deleteMaterial: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.bom.Update),
            ApiOperation({ summary: 'Remove material from revision (Draft only)' }),
            ApiResponse({ status: 200, description: 'Material removed' }),
        ),
};
