import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Permissions } from '@/common/permissions';
import { RequiresPermissions } from '@/modules/auth/decorators/permission.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';

import { ProductDetailResponseDto, ProductListResponseDto } from './dto/product-response.dto';

export const ProductDecorators = {
    list: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.products.Read),
            ApiOperation({ summary: 'List all products' }),
            ApiResponse({ status: 200, type: ProductListResponseDto, description: 'Products fetched successfully' }),
        ),

    create: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.products.Write),
            ApiOperation({ summary: 'Create a new product' }),
            ApiResponse({ status: 201, type: ProductDetailResponseDto, description: 'Product created successfully' }),
            ApiResponse({ status: 400, description: 'Bad Request' }),
        ),

    findOne: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.products.Read),
            ApiOperation({ summary: 'Get a product by ID' }),
            ApiResponse({ status: 200, type: ProductDetailResponseDto, description: 'Product fetched successfully' }),
            ApiResponse({ status: 404, description: 'Product not found' }),
        ),

    update: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.products.Update),
            ApiOperation({ summary: 'Update a product' }),
            ApiResponse({ status: 200, type: ProductDetailResponseDto, description: 'Product updated successfully' }),
            ApiResponse({ status: 404, description: 'Product not found' }),
        ),

    delete: () =>
        applyDecorators(
            UseGuards(JwtAuthGuard, PermissionGuard),
            RequiresPermissions(Permissions.products.Delete),
            ApiOperation({ summary: 'Delete a product' }),
            ApiResponse({ status: 200, description: 'Product deleted successfully' }),
            ApiResponse({ status: 404, description: 'Product not found' }),
        ),
};
