import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

export const WorkOrderDecorators = {
    createWorkOrder: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.work_orders.Write),
            ApiOperation({ summary: 'Create a new work order' }),
            ApiResponse({ status: 201, description: 'Work order created successfully' }),
        ),

    releaseWorkOrder: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.work_orders.Release),
            ApiOperation({ summary: 'Release a work order to production' }),
            ApiResponse({ status: 200, description: 'Work order released successfully' }),
        ),

    listWorkOrders: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.work_orders.Read),
            ApiOperation({ summary: 'List all work orders for the organization' }),
            ApiResponse({ status: 200, description: 'Work orders fetched successfully' }),
        ),
};
