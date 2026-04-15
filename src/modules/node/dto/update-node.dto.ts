import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { nameRegex, validateText } from '@/common/helpers/validations';
import { updateZodDto } from '@/common/helpers/zod-strict';

const updateNodeSchema = z
    .object({
        name: validateText({ regex: nameRegex, min: 1 }).optional(),
        definitionId: z.string().uuid('Invalid definition UUID').optional(),
        attributes: z.record(z.string(), z.any()).optional(),
        capabilities: z.array(z.string()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

export class UpdateNodeDto extends updateZodDto(updateNodeSchema) {
    @ApiProperty({
        description: 'New human-readable name of the node',
        example: 'Assembly Station 1 - Updated',
        required: false,
    })
    name?: string;

    @ApiProperty({
        description: 'Updated ID of the node definition',
        example: '550e8400-e29b-41d4-a716-446655440001',
        required: false,
    })
    definitionId?: string;

    @ApiProperty({
        description: 'Updated custom attributes',
        required: false,
    })
    attributes?: Record<string, any>;

    @ApiProperty({
        description: 'Updated list of capabilities or tags',
        example: ['assembly', 'testing'],
        required: false,
    })
    capabilities?: string[];
}
