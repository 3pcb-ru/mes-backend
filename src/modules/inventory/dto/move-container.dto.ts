import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const moveContainerSchema = z.object({
    targetNodeId: z.string().min(1, 'Target Node ID is required'),
    userId: z.string().optional(),
});

export class MoveContainerDto extends createStrictZodDto(moveContainerSchema) {}
