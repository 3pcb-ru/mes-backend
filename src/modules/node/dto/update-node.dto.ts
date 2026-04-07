import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateNodeSchema = z
    .object({
        name: z.string().min(1, 'Name cannot be empty').optional(),
        definitionId: z.string().uuid('Invalid definition UUID').optional(),
        attributes: z.record(z.string(), z.any()).optional(),
        capabilities: z.array(z.string()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

export class UpdateNodeDto extends createZodDto(updateNodeSchema) {}
