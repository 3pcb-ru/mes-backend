import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const nodeEventSchema = z.object({
    nodeId: z.string().min(1, 'Node ID is required'),
    topic: z.string().min(1, 'Topic is required'),
    payload: z.record(z.string(), z.any()).optional(),
    timestamp: z.string().optional(),
});

export class NodeEventDto extends createStrictZodDto(nodeEventSchema) {}
