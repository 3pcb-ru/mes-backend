import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const unitExecutionSchema = z.object({
    id: z.uuidv4(),
    organizationId: z.uuidv4(),
    workOrderId: z.uuidv4(),
    serialNumber: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'quarantined']),
    currentNodeId: z.uuidv4().nullable(),
    startedAt: isoDateTime.nullable(),
    completedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

// --- DTOs ---

const createUnitExecutionSchema = z.object({
    serialNumber: z.string().min(1),
    workOrderId: z.uuidv4(),
});

export class CreateUnitExecutionDto extends createStrictZodDto(createUnitExecutionSchema) {
    @ApiProperty({
        description: 'Unique serial number for the unit being executed',
        example: 'SN-2024-001',
    })
    serialNumber: string;

    @ApiProperty({
        description: 'The unique identifier of the associated work order',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    workOrderId: string;
}

export class ListExecutionQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class ExecutionResponseDto extends createStrictZodDto(unitExecutionSchema) {
    @ApiProperty({ description: 'Unique ID of the execution unit' })
    id: string;

    @ApiProperty({ description: 'ID of the associated organization' })
    organizationId: string;

    @ApiProperty({ description: 'ID of the associated work order' })
    workOrderId: string;

    @ApiProperty({ description: 'Serial number of the unit' })
    serialNumber: string;

    @ApiProperty({
        description: 'Current execution status',
        enum: ['pending', 'in_progress', 'completed', 'failed', 'quarantined'],
    })
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'quarantined';

    @ApiProperty({ description: 'ID of the current node in the process', required: false })
    currentNodeId: string | null;

    @ApiProperty({ description: 'Execution start timestamp', required: false })
    startedAt: string | null;

    @ApiProperty({ description: 'Execution completion timestamp', required: false })
    completedAt: string | null;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: string;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: string;
}

export class ExecutionListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(unitExecutionSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Executions retrieved successfully' })
    message: string;

    @ApiProperty({ type: [ExecutionResponseDto] })
    data: ExecutionResponseDto[];

    @ApiProperty()
    pagination: any;
}

export class ExecutionDetailResponseDto extends createStrictZodDto(createApiResponseSchema(unitExecutionSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Execution retrieved successfully' })
    message: string;

    @ApiProperty({ type: ExecutionResponseDto })
    data: ExecutionResponseDto;
}
