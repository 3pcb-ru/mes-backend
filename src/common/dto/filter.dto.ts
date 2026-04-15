import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const filterOperatorSchema = z.enum([
    'iLike',
    'notILike',
    'eq',
    'ne',
    'inArray',
    'notInArray',
    'isEmpty',
    'isNotEmpty',
    'lt',
    'lte',
    'gt',
    'gte',
    'isBetween',
    'isRelativeToToday',
]);

const filterVariantSchema = z.enum(['text', 'number', 'range', 'date', 'dateRange', 'boolean', 'select', 'multiSelect']);

const joinOperatorSchema = z.enum(['and', 'or']);

export const columnFilterSchema = z.object({
    id: z.string().describe('Column identifier to filter on'),
    operator: filterOperatorSchema.describe('Filter operator to apply'),
    value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]).describe('Filter value(s)'),
    variant: filterVariantSchema.describe('Filter variant type'),
    joinOperator: joinOperatorSchema.optional().describe('Join operator for combining with other filters'),
});

export class ColumnFilterDto extends createZodDto(columnFilterSchema) {
    @ApiProperty({ description: 'Column identifier to filter on', example: 'name' })
    id: string;

    @ApiProperty({
        description: 'Filter operator to apply',
        enum: ['iLike', 'notILike', 'eq', 'ne', 'inArray', 'notInArray', 'isEmpty', 'isNotEmpty', 'lt', 'lte', 'gt', 'gte', 'isBetween', 'isRelativeToToday'],
        example: 'eq',
    })
    operator: 'iLike' | 'notILike' | 'eq' | 'ne' | 'inArray' | 'notInArray' | 'isEmpty' | 'isNotEmpty' | 'lt' | 'lte' | 'gt' | 'gte' | 'isBetween' | 'isRelativeToToday';

    @ApiProperty({ description: 'Filter value(s)', example: 'Product Name' })
    value: string | number | string[] | number[];

    @ApiProperty({
        description: 'Filter variant type',
        enum: ['text', 'number', 'range', 'date', 'dateRange', 'boolean', 'select', 'multiSelect'],
        example: 'text',
    })
    variant: 'text' | 'number' | 'range' | 'date' | 'dateRange' | 'boolean' | 'select' | 'multiSelect';

    @ApiProperty({
        description: 'Join operator for combining with other filters',
        enum: ['and', 'or'],
        required: false,
    })
    joinOperator?: 'and' | 'or';
}

// Filter query schema with preprocess to accept JSON string at runtime but document as array(ColumnFilter)
const filterQuerySchema = z.object({
    filters: z
        .preprocess((val) => {
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    return parsed;
                } catch {
                    return val;
                }
            }
            return val;
        }, z.array(columnFilterSchema))
        .optional()
        .describe('Array of column filters (accepts JSON string input at runtime).'),
    joinOperator: joinOperatorSchema.optional().default('and').describe('Global join operator for combining all filters'),
});

export class FilterQueryDto extends createZodDto(filterQuerySchema) {
    @ApiProperty({
        description: 'Array of column filters',
        type: [ColumnFilterDto],
        required: false,
    })
    filters?: ColumnFilterDto[];

    @ApiProperty({
        description: 'Global join operator for combining all filters',
        enum: ['and', 'or'],
        default: 'and',
        required: false,
    })
    joinOperator: 'and' | 'or';
}

const paginatedFilterQuerySchema = filterQuerySchema.extend({
    page: z.coerce.number().int().min(1).optional().default(1).describe('Page number (1-based)'),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10).describe('Number of items per page'),
    sortBy: z.string().optional().describe('Column to sort by'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order'),
});

export class PaginatedFilterQueryDto extends createZodDto(paginatedFilterQuerySchema) {
    @ApiProperty({
        description: 'Array of column filters',
        type: [ColumnFilterDto],
        required: false,
    })
    filters?: ColumnFilterDto[];

    @ApiProperty({
        description: 'Global join operator for combining all filters',
        enum: ['and', 'or'],
        default: 'and',
        required: false,
    })
    joinOperator: 'and' | 'or';

    @ApiProperty({ description: 'Page number (1-based)', example: 1, default: 1, required: false })
    page: number;

    @ApiProperty({ description: 'Number of items per page', example: 10, default: 10, required: false })
    limit: number;

    @ApiProperty({ description: 'Column to sort by', example: 'createdAt', required: false })
    sortBy?: string;

    @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc', required: false })
    sortOrder: 'asc' | 'desc';
}
