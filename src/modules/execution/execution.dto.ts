import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const unitExecutionSchema = z.object({
    id: z.uuidv4(),
    organizationId: z.uuidv4(),
    workOrderId: z.uuidv4(),
    serialNumber: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'quarantined']),
    currentNodeId: z.uuidv4().nullable(),
    startedAt: isoDateTime.nullable(),
    completedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

// --- DTOs ---

export class CreateUnitExecutionDto extends createStrictZodDto(
    z.object({
        serialNumber: z.string().min(1),
        workOrderId: z.uuidv4(),
    }),
) {}

export class ListExecutionQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class ExecutionResponseDto extends createStrictZodDto(unitExecutionSchema) {}
export class ExecutionListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(unitExecutionSchema)) {}
export class ExecutionDetailResponseDto extends createStrictZodDto(createApiResponseSchema(unitExecutionSchema)) {}
