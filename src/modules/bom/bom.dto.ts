import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { isoDateTime } from '@/common/helpers/validations';
import { createStrictZodDto, updateZodDto } from '@/common/helpers/zod-strict';

// --- SCHEMAS ---

export const bomRevisionSchema = z.object({
    id: z.uuidv4(),
    productId: z.uuidv4(),
    version: z.string(),
    status: z.enum(['draft', 'submitted', 'approved', 'active']),
    baseRevisionId: z.uuidv4().nullable().optional(),
    submittedById: z.uuidv4().nullable().optional(),
    submitDate: isoDateTime.nullable().optional(),
    approvedById: z.uuidv4().nullable().optional(),
    approveDate: isoDateTime.nullable().optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

export const bomMaterialSchema = z.object({
    id: z.uuidv4(),
    bomRevisionId: z.uuidv4(),
    itemId: z.uuidv4(),
    designators: z.array(z.string()),
    alternatives: z.array(z.uuidv4()),
    quantity: z.coerce.number(),
    unit: z.string(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
});

// --- DTOs ---

const createRevisionSchema = z.object({
    version: z
        .string()
        .regex(/^\d+\.\d+$/)
        .optional(),
    baseRevisionId: z.uuidv4().optional(),
});

export class CreateRevisionDto extends createStrictZodDto(createRevisionSchema) {
    @ApiProperty({
        description: 'The version number of the BOM (e.g., 1.0)',
        example: '1.0',
        required: false,
    })
    version?: string;

    @ApiProperty({
        description: 'Optional ID of the base revision to branch from',
        example: '550e8400-e29b-41d4-a716-446655440001',
        required: false,
    })
    baseRevisionId?: string;
}

const createMaterialSchema = z.object({
    itemId: z.uuidv4(),
    designators: z.array(z.string()).default([]),
    alternatives: z.array(z.uuidv4()).default([]),
    quantity: z.number().positive(),
    unit: z.string().min(1),
});

export class CreateMaterialDto extends createStrictZodDto(createMaterialSchema) {
    @ApiProperty({
        description: 'The unique identifier of the item/part',
        example: '550e8400-e29b-41d4-a716-446655440002',
    })
    itemId: string;

    @ApiProperty({
        description: 'Reference designators for the component (e.g., R1, C1)',
        example: ['R1', 'R2'],
        required: false,
    })
    designators: string[];

    @ApiProperty({
        description: 'List of alternative part IDs',
        example: ['550e8400-e29b-41d4-a716-446655440003'],
        required: false,
    })
    alternatives: string[];

    @ApiProperty({
        description: 'Quantity of the item required',
        example: 5,
    })
    quantity: number;

    @ApiProperty({
        description: 'Unit of measurement',
        example: 'pcs',
    })
    unit: string;
}

const updateMaterialSchema = z.object({
    itemId: z.uuidv4().optional(),
    designators: z.array(z.string()).optional(),
    alternatives: z.array(z.uuidv4()).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().min(1).optional(),
});

export class UpdateMaterialDto extends updateZodDto(updateMaterialSchema) {
    @ApiProperty({ description: 'The unique identifier of the item/part', required: false })
    itemId?: string;

    @ApiProperty({ description: 'Reference designators', required: false })
    designators?: string[];

    @ApiProperty({ description: 'List of alternative part IDs', required: false })
    alternatives?: string[];

    @ApiProperty({ description: 'Quantity required', required: false })
    quantity?: number;

    @ApiProperty({ description: 'Unit of measurement', required: false })
    unit?: string;
}

export class ListBomQueryDto extends PaginatedFilterQueryDto {}

// --- RESPONSES ---

export class BomRevisionResponseDto extends createStrictZodDto(bomRevisionSchema) {
    @ApiProperty({ description: 'Unique ID of the BOM Revision' })
    id: string;

    @ApiProperty({ description: 'ID of the associated product' })
    productId: string;

    @ApiProperty({ description: 'Version string', example: '1.0' })
    version: string;

    @ApiProperty({ description: 'Status of the revision', enum: ['draft', 'submitted', 'approved', 'active'] })
    status: 'draft' | 'submitted' | 'approved' | 'active';

    @ApiProperty({ description: 'ID of the base revision', required: false })
    baseRevisionId?: string | null;

    @ApiProperty({ description: 'User ID who submitted the revision', required: false })
    submittedById?: string | null;

    @ApiProperty({ description: 'Submission date', required: false })
    submitDate?: string | null;

    @ApiProperty({ description: 'User ID who approved the revision', required: false })
    approvedById?: string | null;

    @ApiProperty({ description: 'Approval date', required: false })
    approveDate?: string | null;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: string;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: string;
}

export class BomMaterialResponseDto extends createStrictZodDto(bomMaterialSchema) {
    @ApiProperty({ description: 'Unique ID of the material entry' })
    id: string;

    @ApiProperty({ description: 'ID of the BOM Revision' })
    bomRevisionId: string;

    @ApiProperty({ description: 'ID of the item' })
    itemId: string;

    @ApiProperty({ description: 'Reference designators' })
    designators: string[];

    @ApiProperty({ description: 'Alternative part IDs' })
    alternatives: string[];

    @ApiProperty({ description: 'Quantity required' })
    quantity: number;

    @ApiProperty({ description: 'Unit of measurement' })
    unit: string;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: string;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: string;
}

export class BomRevisionListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(bomRevisionSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'BOM revisions retrieved successfully' })
    message: string;

    @ApiProperty({ type: [BomRevisionResponseDto] })
    data: BomRevisionResponseDto[];

    @ApiProperty()
    pagination: any;
}

export class BomMaterialListResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(bomMaterialSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'BOM materials retrieved successfully' })
    message: string;

    @ApiProperty({ type: [BomMaterialResponseDto] })
    data: BomMaterialResponseDto[];

    @ApiProperty()
    pagination: any;
}

export class BomRevisionDetailResponseDto extends createStrictZodDto(createApiResponseSchema(bomRevisionSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'BOM revision retrieved successfully' })
    message: string;

    @ApiProperty({ type: BomRevisionResponseDto })
    data: BomRevisionResponseDto;
}

export class BomMaterialDetailResponseDto extends createStrictZodDto(createApiResponseSchema(bomMaterialSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'BOM material retrieved successfully' })
    message: string;

    @ApiProperty({ type: BomMaterialResponseDto })
    data: BomMaterialResponseDto;
}
