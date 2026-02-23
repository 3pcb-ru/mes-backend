import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createWorkOrderSchema = z.object({
    tenantId: z.string().optional(),
    bomRevisionId: z.string().min(1, 'BOM Revision ID is required'),
    targetQuantity: z.number().positive('Target quantity must be strictly positive'),
    plannedStartDate: z.string().optional(), // ISO string validated softly as string for now
});

export class CreateWorkOrderDto extends createStrictZodDto(createWorkOrderSchema) {}
