import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const TraceabilityDecorators = {
    list: () =>
        applyDecorators(
            ApiOperation({ summary: 'List all activities' }),
            ApiResponse({ status: 200, description: 'Activities fetched successfully' }),
        ),

    getById: () =>
        applyDecorators(
            ApiOperation({ summary: 'Get an activity by ID' }),
            ApiResponse({ status: 200, description: 'Activity fetched successfully' }),
            ApiResponse({ status: 404, description: 'Activity not found' }),
        ),

    create: () =>
        applyDecorators(
            ApiOperation({ summary: 'Create a new activity' }),
            ApiResponse({ status: 201, description: 'Activity created successfully' }),
        ),
};
