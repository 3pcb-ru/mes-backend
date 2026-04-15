import { z } from 'zod';

import { validateText } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createActivitySchema = z.object({
    organizationId: z.uuidv4().optional(),
    userId: z.uuidv4().optional(),
    jobId: z.uuidv4().optional(),
    nodeId: z.uuidv4().optional(),
    sourceNodeId: z.uuid().optional(),
    actionType: validateText({ min: 1, max: 255 }),
    metadata: z.record(z.string(), z.any()).optional(),
});

export class CreateActivityDto extends createStrictZodDto(createActivitySchema) {}
