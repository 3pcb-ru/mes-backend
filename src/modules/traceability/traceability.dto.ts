import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const traceabilityActivitySchema = z.object({
    id: z.uuidv4(),
    organizationId: z.uuidv4(),
    userId: z.uuidv4().nullable(),
    jobId: z.uuidv4().nullable(),
    nodeId: z.uuidv4().nullable(),
    sourceNodeId: z.uuidv4().nullable(),
    actionType: z.string().min(1),
    metadata: z.record(z.string(), z.any()).nullable(),
    createdAt: isoDateTime,
});

// --- DTOs ---

export class CreateActivityDto extends createStrictZodDto(
    z.object({
        jobId: z.uuidv4().optional(),
        nodeId: z.uuidv4().optional(),
        sourceNodeId: z.uuidv4().optional(),
        actionType: z.string().min(1),
        metadata: z.record(z.string(), z.any()).optional(),
    }),
) {}

export class ListTraceabilityQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class ActivityResponseDto extends createStrictZodDto(traceabilityActivitySchema) {}
export class ActivityListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(traceabilityActivitySchema)) {}
export class ActivityDetailResponseDto extends createStrictZodDto(createApiResponseSchema(traceabilityActivitySchema)) {}
