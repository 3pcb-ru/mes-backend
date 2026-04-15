import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { createApiResponseSchema } from '@/common/helpers/api-response';
import { validateText } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';
import { organizationSelectSchema, uuidSchema } from '@/models/zod-schemas';

const updateOrganizationSchema = z
    .object({
        name: validateText({ min: 1, max: 255 }).optional(),
        logoId: uuidSchema.optional().nullable(),
    })
    .refine((data) => data.name !== undefined || data.logoId !== undefined, {
        message: 'At least one field must be provided for update',
    });

const createOrganizationSchema = z.object({
    name: validateText({ min: 1, max: 255 }),
    timezone: z.string().max(50).optional().default('UTC'),
});

export class UpdateOrganizationDto extends createStrictZodDto(updateOrganizationSchema) {
    @ApiProperty({ description: 'New name for the organization', example: 'Acme Corp Updated', required: false })
    name?: string;

    @ApiProperty({ description: 'ID of the organization logo attachment', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
    logoId?: string | null;
}

export class CreateOrganizationDto extends createStrictZodDto(createOrganizationSchema) {
    @ApiProperty({ description: 'Name of the organization', example: 'Acme Corp' })
    name: string;

    @ApiProperty({ description: 'Timezone for the organization', example: 'UTC', default: 'UTC', required: false })
    timezone: string;
}

export class OrganizationResponseDto extends createStrictZodDto(organizationSelectSchema) {
    @ApiProperty({ description: 'Unique organization ID' })
    id: string;

    @ApiProperty({ description: 'Organization name' })
    name: string;

    @ApiProperty({ description: 'Organization timezone' })
    timezone: string;

    @ApiProperty({ description: 'Organization settings', required: false })
    settings: any;

    @ApiProperty({ description: 'ID of the organization logo', required: false })
    logoId: string | null;

    @ApiProperty({ description: 'URL of the organization logo', required: false })
    logoUrl?: string | null;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: Date;

    @ApiProperty({ description: 'Deletion timestamp', required: false })
    deletedAt: Date | null;
}

export class OrganizationApiResponseDto extends createStrictZodDto(createApiResponseSchema(organizationSelectSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Organization retrieved successfully' })
    message: string;

    @ApiProperty({ type: OrganizationResponseDto })
    data: OrganizationResponseDto;
}
