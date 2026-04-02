import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';

const listNodesSchema = z.object({
    type: z.string().optional().describe('Filter by node type'),
    organizationId: z.uuid({ version: 'v4' }).optional().describe('Filter by organization ID'),
    userId: z.uuid({ version: 'v4' }).optional().describe('Filter by user ID'),
});

const paginatedListNodesSchema = z.preprocess((val: unknown) => {
    // If val is an object, we want to make sure we don't lose the base pagination fields
    return val;
}, PaginatedFilterQueryDto.schema.extend(listNodesSchema.shape));

export class ListNodesDto extends createZodDto(paginatedListNodesSchema) {}
