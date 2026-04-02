import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createNodeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
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

export class CreateNodeDto extends createZodDto(createNodeSchema) {}
