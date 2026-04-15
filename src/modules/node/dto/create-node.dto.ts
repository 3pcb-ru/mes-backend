import { z } from 'zod';
import { nameRegex, validateText } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createNodeSchema = z.object({
    name: validateText({ regex: nameRegex, min: 1 }),
    definitionId: z
        .uuid('Invalid definition UUID')
        .optional()
        .or(z.literal('').transform(() => undefined)),
    status: z.string().optional(),
    attributes: z.record(z.string(), z.any()).optional(),
    capabilities: z.array(z.string()).optional(),
    parentId: z
        .uuid('Invalid parent UUID')
        .optional()
        .or(z.literal('').transform(() => undefined)),
    userId: z.uuid({ version: 'v4' }).optional(),
});

export class CreateNodeDto extends createStrictZodDto(createNodeSchema) {}
