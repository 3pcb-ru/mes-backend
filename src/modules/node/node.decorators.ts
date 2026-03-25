import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const NodeDecorators = {
    list: () =>
        applyDecorators(
            ApiOperation({ summary: 'List all nodes' }),
            ApiResponse({ status: 200, description: 'Nodes fetched successfully' }),
        ),

    create: () =>
        applyDecorators(
            ApiOperation({ summary: 'Create a new node' }),
            ApiResponse({ status: 201, description: 'Node created successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),

    findOne: () =>
        applyDecorators(
            ApiOperation({ summary: 'Get a node by ID' }),
            ApiResponse({ status: 200, description: 'Node fetched successfully' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),

    changeStatus: () =>
        applyDecorators(
            ApiOperation({ summary: 'Change node status' }),
            ApiResponse({ status: 200, description: 'Status updated successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),

    update: () =>
        applyDecorators(
            ApiOperation({ summary: 'Update node attributes' }),
            ApiResponse({ status: 200, description: 'Node updated successfully' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),
};
