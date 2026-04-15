import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const workOrderSchema = z.object({
    id: z.uuidv4(),
    organizationId: z.uuidv4(),
    bomRevisionId: z.uuidv4(),
    targetQuantity: z.coerce.number(),
    status: z.enum(['draft', 'released', 'in_progress', 'completed', 'cancelled']),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

// --- DTOs ---

export class CreateWorkOrderDto extends createStrictZodDto(
    z.object({
        bomRevisionId: z.uuidv4(),
        targetQuantity: z.number().positive(),
    }),
) {}

export class ListWorkOrdersQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class WorkOrderResponseDto extends createStrictZodDto(workOrderSchema) {}
export class WorkOrderListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(workOrderSchema)) {}
export class WorkOrderDetailResponseDto extends createStrictZodDto(createApiResponseSchema(workOrderSchema)) {}
