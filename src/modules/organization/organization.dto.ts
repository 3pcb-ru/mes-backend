import { z } from 'zod';

import { createApiResponseSchema } from '@/common/helpers/api-response';
import { validateText } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';
import { uuidSchema } from '@/models/zod-schemas';

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

// Response Schema
const organizationResponseSchema = z.object({
    id: z.uuid({ version: 'v4' }),
    name: z.string(),
    timezone: z.string(),
    logoId: z.uuid({ version: 'v4' }).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export class UpdateOrganizationDto extends createStrictZodDto(updateOrganizationSchema) {}
export class CreateOrganizationDto extends createStrictZodDto(createOrganizationSchema) {}
export class OrganizationResponseDto extends createStrictZodDto(organizationResponseSchema) {}
export class OrganizationApiResponseDto extends createStrictZodDto(createApiResponseSchema(organizationResponseSchema)) {}
