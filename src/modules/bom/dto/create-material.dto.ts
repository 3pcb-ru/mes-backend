import { z } from 'zod';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createMaterialSchema = z.object({
    itemId: z.string().uuid(),
    designators: z.array(z.string()).default([]),
    alternatives: z.array(z.string().uuid()).default([]),
    quantity: z.number().positive(),
    unit: z.string().min(1),
});

export class CreateMaterialDto extends createStrictZodDto(createMaterialSchema) {}
