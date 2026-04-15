import { z } from 'zod';
import { nameRegex, validateText } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createProductSchema = z.object({
    sku: validateText({ min: 1 }),
    name: validateText({ regex: nameRegex, min: 1 }),
});

export class CreateProductDto extends createStrictZodDto(createProductSchema) {}
