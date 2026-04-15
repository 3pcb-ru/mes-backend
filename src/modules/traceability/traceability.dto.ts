import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const traceabilityActivitySchema = z.object({
    id: z.uuidv4(),
    organizationId: z.uuidv4(),
    userId: z.uuidv4().nullable(),
    jobId: z.uuidv4().nullable(),
    nodeId: z.uuidv4().nullable(),
    sourceNodeId: z.uuidv4().nullable(),
    actionType: z.string().min(1),
    metadata: z.record(z.string(), z.any()).nullable(),
    createdAt: isoDateTime,
});

export const auditLogSchema = z.object({
    id: z.uuidv4(),
    organizationId: z.uuidv4(),
    userId: z.uuidv4().nullable(),
    entityType: z.string().min(1),
    entityId: z.uuidv4(),
    action: z.enum(['INSERT', 'UPDATE', 'DELETE']),
    oldData: z.record(z.string(), z.any()).nullable(),
    newData: z.record(z.string(), z.any()).nullable(),
    createdAt: isoDateTime,
});

// --- DTOs ---

const createActivitySchema = z.object({
    jobId: z.uuidv4().optional(),
    nodeId: z.uuidv4().optional(),
    sourceNodeId: z.uuidv4().optional(),
    actionType: z.string().min(1),
    metadata: z.record(z.string(), z.any()).optional(),
});

export class CreateActivityDto extends createStrictZodDto(createActivitySchema) {
    @ApiProperty({ description: 'ID of the job associated with this activity', required: false })
    jobId?: string;

    @ApiProperty({ description: 'ID of the node where the activity occurred', required: false })
    nodeId?: string;

    @ApiProperty({ description: 'ID of the source node (for transfers)', required: false })
    sourceNodeId?: string;

    @ApiProperty({ description: 'Type of action performed', example: 'SCAN_START' })
    actionType: string;

    @ApiProperty({ description: 'Additional metadata for the activity', required: false })
    metadata?: Record<string, any>;
}

export class RecordChangeDto {
    @ApiProperty({ description: 'Type of entity being changed', example: 'WorkOrder' })
    entityType: string;

    @ApiProperty({ description: 'ID of the entity' })
    entityId: string;

    @ApiProperty({ description: 'Action type', enum: ['INSERT', 'UPDATE', 'DELETE'] })
    action: 'INSERT' | 'UPDATE' | 'DELETE';

    @ApiProperty({ description: 'State of the entity before change', required: false })
    oldData?: Record<string, any>;

    @ApiProperty({ description: 'State of the entity after change', required: false })
    newData?: Record<string, any>;
}

export class ListTraceabilityQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class ActivityResponseDto extends createStrictZodDto(traceabilityActivitySchema) {
    @ApiProperty({ description: 'Unique ID of the activity log' })
    id: string;

    @ApiProperty({ description: 'ID of the organization' })
    organizationId: string;

    @ApiProperty({ description: 'ID of the user who performed the activity', required: false })
    userId: string | null;

    @ApiProperty({ description: 'ID of the associated job', required: false })
    jobId: string | null;

    @ApiProperty({ description: 'ID of the current node', required: false })
    nodeId: string | null;

    @ApiProperty({ description: 'ID of the source node', required: false })
    sourceNodeId: string | null;

    @ApiProperty({ description: 'Action type' })
    actionType: string;

    @ApiProperty({ description: 'Action metadata', required: false })
    metadata: Record<string, any> | null;

    @ApiProperty({ description: 'Activity creation timestamp' })
    createdAt: string;
}

export class ActivityListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(traceabilityActivitySchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Activities retrieved successfully' })
    message: string;

    @ApiProperty({ type: [ActivityResponseDto] })
    data: ActivityResponseDto[];

    @ApiProperty()
    pagination: any;
}

export class ActivityDetailResponseDto extends createStrictZodDto(createApiResponseSchema(traceabilityActivitySchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Activity retrieved successfully' })
    message: string;

    @ApiProperty({ type: ActivityResponseDto })
    data: ActivityResponseDto;
}

export class AuditLogResponseDto extends createStrictZodDto(auditLogSchema) {
    @ApiProperty({ description: 'Unique ID of the audit log entry' })
    id: string;

    @ApiProperty({ description: 'ID of the organization' })
    organizationId: string;

    @ApiProperty({ description: 'ID of the user who made the change', required: false })
    userId: string | null;

    @ApiProperty({ description: 'Type of entity changed', example: 'Product' })
    entityType: string;

    @ApiProperty({ description: 'ID of the changed entity' })
    entityId: string;

    @ApiProperty({ description: 'Type of change', enum: ['INSERT', 'UPDATE', 'DELETE'] })
    action: 'INSERT' | 'UPDATE' | 'DELETE';

    @ApiProperty({ description: 'Data before the change', required: false })
    oldData: Record<string, any> | null;

    @ApiProperty({ description: 'Data after the change', required: false })
    newData: Record<string, any> | null;

    @ApiProperty({ description: 'Log creation timestamp' })
    createdAt: string;
}

export class AuditLogListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(auditLogSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Audit logs retrieved successfully' })
    message: string;

    @ApiProperty({ type: [AuditLogResponseDto] })
    data: AuditLogResponseDto[];

    @ApiProperty()
    pagination: any;
}
