import { z } from 'zod';

import { createStrictZodDto } from '@/common/helpers/zod-strict';

const createFacilitySchema = z.object({
    tenantId: z.string().optional(),
    parentId: z.string().nullable().optional(),
    path: z.string().min(1, 'Path is required'), // ltree style e.g. Factory.Line1.Oven
    definitionId: z.string().nullable().optional(),
    name: z.string().min(1, 'Name is required'),
    capabilities: z.array(z.string()).optional(),
    status: z.string().optional(),
    attributes: z.record(z.string(), z.any()).optional(),
});

export class CreateFacilityDto extends createStrictZodDto(createFacilitySchema) {}
