import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ExecutionDecorators = {
    list: () =>
        applyDecorators(
            ApiOperation({ summary: 'List all work orders (Execution Mock)' }),
            ApiResponse({ status: 200, description: 'Work orders fetched successfully' }),
        ),

    create: () =>
        applyDecorators(
            ApiOperation({ summary: 'Create a new work order (Execution Mock)' }),
            ApiResponse({ status: 201, description: 'Work order created successfully' }),
        ),

    get: () =>
        applyDecorators(
            ApiOperation({ summary: 'Get a work order by ID (Execution Mock)' }),
            ApiResponse({ status: 200, description: 'Work order fetched successfully' }),
            ApiResponse({ status: 404, description: 'Work order not found' }),
        ),
};
