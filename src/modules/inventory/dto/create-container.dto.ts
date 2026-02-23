import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createContainerSchema = z.object({
    tenantId: z.string().optional(),
    locationNodeId: z.string().nullable().optional(),
    lpn: z.string().min(1, 'LPN is required'),
    type: z.string().optional(), // REEL, TRAY, BOX
});

export class CreateContainerDto extends createStrictZodDto(createContainerSchema) {}
