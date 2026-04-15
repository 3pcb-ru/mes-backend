import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto, updateZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const bomRevisionSchema = z.object({
    id: z.uuidv4(),
    productId: z.uuidv4(),
    version: z.string(),
    status: z.enum(['draft', 'submitted', 'approved', 'active']),
    baseRevisionId: z.uuidv4().nullable().optional(),
    submittedById: z.uuidv4().nullable().optional(),
    submitDate: isoDateTime.nullable().optional(),
    approvedById: z.uuidv4().nullable().optional(),
    approveDate: isoDateTime.nullable().optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

export const bomMaterialSchema = z.object({
    id: z.uuidv4(),
    bomRevisionId: z.uuidv4(),
    itemId: z.uuidv4(),
    designators: z.array(z.string()),
    alternatives: z.array(z.uuidv4()),
    quantity: z.coerce.number(),
    unit: z.string(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

// --- DTOs ---

export class CreateRevisionDto extends createStrictZodDto(
    z.object({
        version: z
            .string()
            .regex(/^\d+\.\d+$/)
            .optional(),
        baseRevisionId: z.uuidv4().optional(),
    }),
) {}

export class CreateMaterialDto extends createStrictZodDto(
    z.object({
        itemId: z.uuidv4(),
        designators: z.array(z.string()).default([]),
        alternatives: z.array(z.uuidv4()).default([]),
        quantity: z.number().positive(),
        unit: z.string().min(1),
    }),
) {}

export class UpdateMaterialDto extends updateZodDto(
    z.object({
        itemId: z.uuidv4().optional(),
        designators: z.array(z.string()).optional(),
        alternatives: z.array(z.uuidv4()).optional(),
        quantity: z.number().positive().optional(),
        unit: z.string().min(1).optional(),
    }),
) {}

export class ListBomQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class BomRevisionResponseDto extends createStrictZodDto(bomRevisionSchema) {}
export class BomMaterialResponseDto extends createStrictZodDto(bomMaterialSchema) {}

export class BomRevisionListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(bomRevisionSchema)) {}
export class BomMaterialListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(bomMaterialSchema)) {}

export class BomRevisionDetailResponseDto extends createStrictZodDto(createApiResponseSchema(bomRevisionSchema)) {}
export class BomMaterialDetailResponseDto extends createStrictZodDto(createApiResponseSchema(bomMaterialSchema)) {}
