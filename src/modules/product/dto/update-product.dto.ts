import { z } from 'zod';
import { nameRegex, validateText } from '@/common/helpers/validations';
import { updateZodDto } from '@/common/helpers/zod-strict';

const updateProductSchema = z.object({
    sku: validateText({ min: 1 }).optional(),
    name: validateText({ regex: nameRegex, min: 1 }).optional(),
});

export class UpdateProductDto extends updateZodDto(updateProductSchema) {}
