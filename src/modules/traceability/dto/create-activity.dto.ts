import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createActivitySchema = z.object({
    tenantId: z.uuidv4().optional(),
    userId: z.uuidv4().optional(),
    jobId: z.uuidv4().optional(),
    nodeId: z.uuidv4().optional(),
    sourceNodeId: z.uuid().optional(),
    actionType: z.string().min(1, 'Action type is required'),
    metadata: z.record(z.string(), z.any()).optional(),
});

export class CreateActivityDto extends createStrictZodDto(createActivitySchema) {}
