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

export class UpdateNodeDto extends updateZodDto(updateNodeSchema) {}
