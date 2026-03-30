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

    move: () =>
        applyDecorators(
            ApiOperation({ summary: 'Move node to a new parent' }),
            ApiResponse({ status: 200, description: 'Node moved successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
            ApiResponse({ status: 404, description: 'Node or parent not found' }),
        ),

    delete: () =>
        applyDecorators(
            ApiOperation({ summary: 'Delete or archive a node' }),
            ApiResponse({ status: 200, description: 'Node deleted or archived successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request - node has children or active jobs' }),
            ApiResponse({ status: 404, description: 'Node not found' }),
        ),
};
