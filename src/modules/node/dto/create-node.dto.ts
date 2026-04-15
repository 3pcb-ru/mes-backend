import { ApiProperty } from '@nestjs/swagger';
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

export class CreateNodeDto extends createStrictZodDto(createNodeSchema) {
    @ApiProperty({
        description: 'Human-readable name of the node',
        example: 'Assembly Station 1',
    })
    name: string;

    @ApiProperty({
        description: 'Optional ID of the node definition',
        example: '550e8400-e29b-41d4-a716-446655440001',
        required: false,
    })
    definitionId?: string;

    @ApiProperty({
        description: 'Initial status of the node',
        example: 'active',
        required: false,
    })
    status?: string;

    @ApiProperty({
        description: 'Custom attributes as key-value pairs',
        required: false,
    })
    attributes?: Record<string, any>;

    @ApiProperty({
        description: 'List of capabilities or tags for the node',
        example: ['assembly', 'packaging'],
        required: false,
    })
    capabilities?: string[];

    @ApiProperty({
        description: 'Parent node ID (for hierarchy)',
        required: false,
    })
    parentId?: string;

    @ApiProperty({
        description: 'Associated user ID (e.g., operator assigned)',
        required: false,
    })
    userId?: string;
}
