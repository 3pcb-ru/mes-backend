import { z } from 'zod';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime, nameRegex, validateText } from '@/common/helpers/validations';
import { createStrictZodDto, updateZodDto } from '@/common/helpers/zod-strict';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';

// --- SCHEMAS ---

export const productSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    sku: z.string(),
    name: z.string(),
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

export class CreateProductDto extends createStrictZodDto(createProductSchema) {}
export class UpdateProductDto extends updateZodDto(updateProductSchema) {}
export class ListProductsQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class ProductResponseDto extends createStrictZodDto(productSchema) {}
export class ProductListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(productSchema)) {}
export class ProductDetailResponseDto extends createStrictZodDto(createApiResponseSchema(productSchema)) {}
