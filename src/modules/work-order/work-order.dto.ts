import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const workOrderSchema = z.object({
    id: z.uuidv4(),
    organizationId: z.uuidv4(),
    bomRevisionId: z.uuidv4(),
    targetQuantity: z.coerce.number(),
    status: z.enum(['draft', 'released', 'in_progress', 'completed', 'cancelled']),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

// --- DTOs ---

const createWorkOrderSchema = z.object({
    bomRevisionId: z.uuidv4(),
    targetQuantity: z.number().positive(),
});

export class CreateWorkOrderDto extends createStrictZodDto(createWorkOrderSchema) {
    @ApiProperty({
        description: 'The unique identifier of the BOM Revision to use for this work order',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    bomRevisionId: string;

    @ApiProperty({
        description: 'The total quantity to be produced in this work order',
        example: 100,
    })
    targetQuantity: number;
}

export class ListWorkOrdersQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class WorkOrderResponseDto extends createStrictZodDto(workOrderSchema) {
    @ApiProperty({
        description: 'Unique identifier for the work order',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'ID of the organization this work order belongs to',
        example: '550e8400-e29b-41d4-a716-446655440005',
    })
    organizationId: string;

    @ApiProperty({
        description: 'The unique identifier of the BOM Revision used',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    bomRevisionId: string;

    @ApiProperty({
        description: 'The total quantity to be produced',
        example: 100,
    })
    targetQuantity: number;

    @ApiProperty({
        description: 'Current status of the work order',
        enum: ['draft', 'released', 'in_progress', 'completed', 'cancelled'],
        example: 'released',
    })
    status: 'draft' | 'released' | 'in_progress' | 'completed' | 'cancelled';

    @ApiProperty({
        description: 'Creation timestamp',
        example: '2024-03-24T10:00:00Z',
    })
    createdAt: string;

    @ApiProperty({
        description: 'Last update timestamp',
        example: '2024-03-24T10:00:00Z',
    })
    updatedAt: string;
}

export class WorkOrderListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(workOrderSchema)) {
    @ApiProperty({ description: 'Indicates if the request was successful', example: true })
    success: boolean;

    @ApiProperty({ description: 'Response message', example: 'Work orders retrieved successfully' })
    message: string;

    @ApiProperty({ description: 'List of work orders' })
    data: WorkOrderResponseDto[];

    @ApiProperty({ description: 'Pagination metadata' })
    pagination: any;
}

export class WorkOrderDetailResponseDto extends createStrictZodDto(createApiResponseSchema(workOrderSchema)) {
    @ApiProperty({ description: 'Indicates if the request was successful', example: true })
    success: boolean;

    @ApiProperty({ description: 'Response message', example: 'Work order retrieved successfully' })
    message: string;

    @ApiProperty({ description: 'Work order data' })
    data: WorkOrderResponseDto;
}
