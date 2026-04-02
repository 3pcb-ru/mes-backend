import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductDetailResponseDto, ProductListResponseDto } from './dto/product-response.dto';

export const ProductDecorators = {
    list: () =>
        applyDecorators(
            ApiOperation({ summary: 'List all products' }),
            ApiResponse({ status: 200, type: ProductListResponseDto, description: 'Products fetched successfully' }),
        ),

    create: () =>
        applyDecorators(
            ApiOperation({ summary: 'Create a new product' }),
            ApiResponse({ status: 201, type: ProductDetailResponseDto, description: 'Product created successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),

    findOne: () =>
        applyDecorators(
            ApiOperation({ summary: 'Get a product by ID' }),
            ApiResponse({ status: 200, type: ProductDetailResponseDto, description: 'Product fetched successfully' }),
            ApiResponse({ status: 404, description: 'Product not found' }),
        ),

    update: () =>
        applyDecorators(
            ApiOperation({ summary: 'Update a product' }),
            ApiResponse({ status: 200, type: ProductDetailResponseDto, description: 'Product updated successfully' }),
            ApiResponse({ status: 404, description: 'Product not found' }),
        ),
};
