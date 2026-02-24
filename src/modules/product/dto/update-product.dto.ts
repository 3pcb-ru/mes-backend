import { z } from 'zod';

import { updateZodDto } from '@/common/helpers/zod-strict';

const updateProductSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required'),
});

export class UpdateProductDto extends updateZodDto(updateProductSchema) {}
