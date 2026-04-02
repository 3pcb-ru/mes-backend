import { z } from 'zod';
import { createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

export const productResponseSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    sku: z.string(),
    name: z.string(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

export class ProductResponseDto extends createStrictZodDto(productResponseSchema) {}
export class ProductListResponseDto extends createStrictZodDto(createApiResponseSchema(z.array(productResponseSchema))) {}
export class ProductDetailResponseDto extends createStrictZodDto(createApiResponseSchema(productResponseSchema)) {}
