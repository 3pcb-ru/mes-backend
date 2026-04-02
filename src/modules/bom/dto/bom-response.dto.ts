import { z } from 'zod';
import { createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

export const bomRevisionResponseSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    version: z.string(),
    status: z.enum(['draft', 'submitted', 'approved', 'active']),
    baseRevisionId: z.string().uuid().nullable().optional(),
    submittedById: z.string().uuid().nullable().optional(),
    submitDate: isoDateTime.nullable().optional(),
    approvedById: z.string().uuid().nullable().optional(),
    approveDate: isoDateTime.nullable().optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

export const bomMaterialResponseSchema = z.object({
    id: z.string().uuid(),
    bomRevisionId: z.string().uuid(),
    itemId: z.string().uuid(),
    designators: z.array(z.string()),
    alternatives: z.array(z.string().uuid()),
    quantity: z.coerce.number(),
    unit: z.string(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

export class BomRevisionResponseDto extends createStrictZodDto(bomRevisionResponseSchema) {}
export class BomMaterialResponseDto extends createStrictZodDto(bomMaterialResponseSchema) {}

export class BomRevisionListResponseDto extends createStrictZodDto(createApiResponseSchema(z.array(bomRevisionResponseSchema))) {}
export class BomMaterialListResponseDto extends createStrictZodDto(createApiResponseSchema(z.array(bomMaterialResponseSchema))) {}

export class BomRevisionDetailResponseDto extends createStrictZodDto(createApiResponseSchema(bomRevisionResponseSchema)) {}
export class BomMaterialDetailResponseDto extends createStrictZodDto(createApiResponseSchema(bomMaterialResponseSchema)) {}
