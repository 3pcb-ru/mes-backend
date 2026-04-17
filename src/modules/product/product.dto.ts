import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime, nameRegex, validateText } from '@/common/helpers/validations';
import { createStrictZodDto, updateZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const productSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    sku: z.string(),
    name: z.string(),
    activeRevisionVersion: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    totalRevisions: z.number().default(0),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

const createProductSchema = z.object({
    sku: validateText({ min: 1 }),
    name: validateText({ regex: nameRegex, min: 1 }),
});

const updateProductSchema = z.object({
    sku: validateText({ min: 1 }).optional(),
    name: validateText({ regex: nameRegex, min: 1 }).optional(),
});

// --- DTOs ---

export class CreateProductDto extends createStrictZodDto(createProductSchema) {
    @ApiProperty({
        description: 'Stock Keeping Unit (unique identifier for the product)',
        example: 'PROD-001',
    })
    sku: string;

    @ApiProperty({
        description: 'Human-readable name of the product',
        example: 'Standard Desktop Switch',
    })
    name: string;
}

export class UpdateProductDto extends updateZodDto(updateProductSchema) {
    @ApiProperty({ description: 'Stock Keeping Unit', example: 'PROD-001', required: false })
    sku?: string;

    @ApiProperty({ description: 'Human-readable name of the product', example: 'Standard Desktop Switch', required: false })
    name?: string;
}

export class ListProductsQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class ProductResponseDto extends createStrictZodDto(productSchema) {
    @ApiProperty({ description: 'Unique ID of the product' })
    id: string;

    @ApiProperty({ description: 'ID of the associated organization' })
    organizationId: string;

    @ApiProperty({ description: 'Stock Keeping Unit' })
    sku: string;

    @ApiProperty({ description: 'Product name' })
    name: string;
    
    @ApiProperty({ description: 'Active revision version', example: '1.0', required: false })
    activeRevisionVersion?: string | null;

    @ApiProperty({ description: 'Status of the active revision', example: 'active', required: false })
    status?: string | null;

    @ApiProperty({ description: 'Total number of revisions for this product', example: 5 })
    totalRevisions: number;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: string;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: string;
}

export class ProductListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(productSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Products retrieved successfully' })
    message: string;

    @ApiProperty({ type: [ProductResponseDto] })
    data: ProductResponseDto[];

    @ApiProperty()
    pagination: any;
}

export class ProductDetailResponseDto extends createStrictZodDto(createApiResponseSchema(productSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Product retrieved successfully' })
    message: string;

    @ApiProperty({ type: ProductResponseDto })
    data: ProductResponseDto;
}
