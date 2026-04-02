import { z } from 'zod';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createRevisionSchema = z.object({
    version: z.string().regex(/^\d+\.\d+$/).optional(),
    baseRevisionId: z.string().uuid().optional(),
});

export class CreateRevisionDto extends createStrictZodDto(createRevisionSchema) {}
