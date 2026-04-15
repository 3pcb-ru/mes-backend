import { ApiProperty } from '@nestjs/swagger';
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

export class ListNodesDto extends createZodDto(paginatedListNodesSchema) {
    @ApiProperty({ description: 'Filter by node type', required: false })
    type?: string;

    @ApiProperty({ description: 'Filter by organization ID', required: false })
    organizationId?: string;

    @ApiProperty({ description: 'Filter by user ID', required: false })
    userId?: string;

    @ApiProperty({ description: 'Page number', example: 1, required: false, default: 1 })
    page: number;

    @ApiProperty({ description: 'Items per page', example: 10, required: false, default: 10 })
    limit: number;

    @ApiProperty({ description: 'Field to sort by', required: false })
    sortBy?: string;

    @ApiProperty({ description: 'Sort direction', enum: ['asc', 'desc'], required: false, default: 'asc' })
    sortOrder: 'asc' | 'desc';

    @ApiProperty({ description: 'Search term', required: false })
    search?: string;
}
