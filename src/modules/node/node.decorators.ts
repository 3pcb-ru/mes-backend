import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

export const NodeDecorators = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.nodes.Read),
            ApiOperation({ summary: 'List all nodes' }),
            ApiResponse({ status: 200, description: 'Nodes fetched successfully' }),
        ),

    create: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.nodes.Write),
            ApiOperation({ summary: 'Create a new node' }),
            ApiResponse({ status: 201, description: 'Node created successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),

    findOne: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.nodes.Read),
            ApiOperation({ summary: 'Get a node by ID' }),
            ApiResponse({ status: 200, description: 'Node fetched successfully' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),

    changeStatus: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.nodes.Update),
            ApiOperation({ summary: 'Change node status' }),
            ApiResponse({ status: 200, description: 'Status updated successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),

    update: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.nodes.Update),
            ApiOperation({ summary: 'Update node attributes' }),
            ApiResponse({ status: 200, description: 'Node updated successfully' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),

    move: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.nodes.Update),
            ApiOperation({ summary: 'Move node to a new parent' }),
            ApiResponse({ status: 200, description: 'Node moved successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
            ApiResponse({ status: 404, description: 'Node or parent not found' }),
        ),

    delete: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.nodes.Delete),
            ApiOperation({ summary: 'Delete or archive a node' }),
            ApiResponse({ status: 200, description: 'Node deleted or archived successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request - node has children or active jobs' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),
};
