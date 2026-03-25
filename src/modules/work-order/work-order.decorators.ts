import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const WorkOrderDecorators = {
    createWorkOrder: () =>
        applyDecorators(
            ApiOperation({ summary: 'Create a new work order' }),
            ApiResponse({ status: 201, description: 'Work order created successfully' }),
        ),

    releaseWorkOrder: () =>
        applyDecorators(
            ApiOperation({ summary: 'Release a work order to production' }),
            ApiResponse({ status: 200, description: 'Work order released successfully' }),
        ),

    listWorkOrders: () =>
        applyDecorators(
            ApiOperation({ summary: 'List all work orders for the organization' }),
            ApiResponse({ status: 200, description: 'Work orders fetched successfully' }),
        ),
};
