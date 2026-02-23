import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createProductSchema = z.object({
    tenantId: z.string().optional(),
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required'),
});

export class CreateProductDto extends createStrictZodDto(createProductSchema) {}
