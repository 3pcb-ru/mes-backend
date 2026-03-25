import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ProductDecorators = {
    list: () =>
        applyDecorators(
            ApiOperation({ summary: 'List all products' }),
            ApiResponse({ status: 200, description: 'Products fetched successfully' }),
        ),

    create: () =>
        applyDecorators(
            ApiOperation({ summary: 'Create a new product' }),
            ApiResponse({ status: 201, description: 'Product created successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),

    findOne: () =>
        applyDecorators(
            ApiOperation({ summary: 'Get a product by ID' }),
            ApiResponse({ status: 200, description: 'Product fetched successfully' }),
            ApiResponse({ status: 404, description: 'Product not found' }),
        ),

    update: () =>
        applyDecorators(
            ApiOperation({ summary: 'Update a product' }),
            ApiResponse({ status: 200, description: 'Product updated successfully' }),
            ApiResponse({ status: 404, description: 'Product not found' }),
        ),
};
