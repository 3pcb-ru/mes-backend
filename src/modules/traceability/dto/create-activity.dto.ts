import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createActivitySchema = z.object({
    tenantId: z.string().optional(),
    userId: z.string().optional(),
    jobId: z.string().optional(),
    nodeId: z.string().optional(),
    sourceContainerId: z.string().optional(),
    actionType: z.string().min(1, 'Action type is required'),
    metadata: z.record(z.string(), z.any()).optional(),
});

export class CreateActivityDto extends createStrictZodDto(createActivitySchema) {}
