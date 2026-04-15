import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { nameRegex, passwordRegex, phoneNumberRegex, resetCodeRegex, validateText } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';
import {
    publicUserSelectSchema,
    userSelectSchema,
    userUpdateSchema,
    type PublicUserOutput,
    type UserInsertInput,
    type UserSelectOutput,
    type UserUpdateInput,
} from '@/models/zod-schemas';

import { OrganizationResponseDto } from '../organization/organization.dto';
import { RoleResponseDto } from '../roles/roles.dto';

// Base schemas for user operations
const loginSchema = z.object({
    email: z.email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

const updateUserProfileSchema = userUpdateSchema
    .omit({
        id: true,
        password: true,
        isVerified: true,
        verificationToken: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        roleId: true,
    })
    .extend({
        firstName: validateText({ regex: nameRegex }),
        lastName: validateText({ regex: nameRegex }),
        phone: validateText({ regex: phoneNumberRegex, isOptional: true }),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Request body cannot be empty',
        path: [],
    });

const verifyEmailSchema = z.object({
    code: z.string().min(1, 'Verification code is required'),
    email: z.email('Please enter a valid email address'),
});

const forgotPasswordSchema = z.object({
    email: z.email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
    email: z.email('Please enter a valid email address'),
    code: validateText({ regex: resetCodeRegex, min: 6, max: 6 }),
    password: validateText({ regex: passwordRegex, min: 8, max: 15 }),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: validateText({ regex: passwordRegex, min: 8, max: 15 }),
});

const resendVerificationSchema = z.object({
    email: z.email('Please enter a valid email address'),
});

const inviteUserSchema = z.object({
    email: z.email('Please enter a valid email address'),
    firstName: validateText({ regex: nameRegex }),
    lastName: validateText({ regex: nameRegex }),
    roleId: z.string().uuid('Invalid role ID'),
});

const acceptInvitationSchema = z.object({
    token: z.string().min(1, 'Invitation token is required'),
    password: validateText({ regex: passwordRegex, min: 8, max: 15 }),
});

// DTO Classes
export class LoginDto extends createStrictZodDto(loginSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'User password', example: 'P@ssword123' })
    password: string;
}

export class UpdateUserProfileDto extends createStrictZodDto(updateUserProfileSchema) {
    @ApiProperty({ description: 'User first name', example: 'John', required: false })
    firstName: string;

    @ApiProperty({ description: 'User last name', example: 'Doe', required: false })
    lastName: string;

    @ApiProperty({ description: 'User phone number', example: '+1234567890', required: false })
    phone?: string;

    @ApiProperty({ description: 'User avatar URL', example: 'https://example.com/avatar.jpg', required: false })
    avatarUrl?: string | null;
}

export class VerifyEmailDto extends createStrictZodDto(verifyEmailSchema) {
    @ApiProperty({ description: 'Verification code sent to email', example: '123456' })
    code: string;

    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;
}

export class ForgotPasswordDto extends createStrictZodDto(forgotPasswordSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;
}

export class ResetPasswordDto extends createStrictZodDto(resetPasswordSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'Reset code received via email', example: '123456' })
    code: string;

    @ApiProperty({ description: 'New password', example: 'NewP@ssword123' })
    password: string;
}

export class ChangePasswordDto extends createStrictZodDto(changePasswordSchema) {
    @ApiProperty({ description: 'Current password', example: 'OldP@ssword123' })
    currentPassword: string;

    @ApiProperty({ description: 'New password', example: 'NewP@ssword123' })
    password: string;
}

export class ResendVerificationDto extends createStrictZodDto(resendVerificationSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;
}

export class InviteUserDto extends createStrictZodDto(inviteUserSchema) {
    @ApiProperty({ description: 'User email address', example: 'invitee@example.com' })
    email: string;

    @ApiProperty({ description: 'User first name', example: 'Jane' })
    firstName: string;

    @ApiProperty({ description: 'User last name', example: 'Smith' })
    lastName: string;

    @ApiProperty({ description: 'Role ID to assign', example: '550e8400-e29b-41d4-a716-446655440001' })
    roleId: string;
}

export class AcceptInvitationDto extends createStrictZodDto(acceptInvitationSchema) {
    @ApiProperty({ description: 'Invitation token from email', example: 'token123' })
    token: string;

    @ApiProperty({ description: 'New password to set', example: 'SetsP@ssword123' })
    password: string;
}

export class UpdateUserStatusDto extends createStrictZodDto(z.object({ status: z.enum(['active', 'inactive']) })) {
    @ApiProperty({ description: 'New status for the user', enum: ['active', 'inactive'], example: 'active' })
    status: 'active' | 'inactive';
}

// Response schemas
export class UserResponseDto {
    @ApiProperty({ description: 'Unique user ID' })
    id: string;

    @ApiProperty({ description: 'User email' })
    email: string;

    @ApiProperty({ description: 'User first name' })
    firstName: string;

    @ApiProperty({ description: 'User last name' })
    lastName: string;

    @ApiProperty({ description: 'User phone number', required: false })
    phone?: string | null;

    @ApiProperty({ description: 'User avatar ID', required: false })
    avatarId: string | null;

    @ApiProperty({ description: 'User avatar URL', required: false })
    avatarUrl?: string | null;

    @ApiProperty({ description: 'Verification status' })
    isVerified: boolean | null;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: Date;

    @ApiProperty({ description: 'Deletion timestamp', required: false })
    deletedAt?: Date | null;

    @ApiProperty({ description: 'User role ID' })
    roleId: string;

    @ApiProperty({ description: 'User role details' })
    role: RoleResponseDto;

    @ApiProperty({ description: 'User organization ID', required: false })
    organizationId: string | null;

    @ApiProperty({ description: 'User organization details', required: false })
    organization?: OrganizationResponseDto | null;
}

// API response wrappers
export class UserApiResponseDto extends createStrictZodDto(createApiResponseSchema(publicUserSelectSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'User retrieved successfully' })
    message: string;

    @ApiProperty({ type: UserResponseDto })
    data: UserResponseDto;
}

export class FullUserApiResponseDto extends createStrictZodDto(createApiResponseSchema(userSelectSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'User retrieved successfully' })
    message: string;

    @ApiProperty({ type: UserResponseDto })
    data: any;
}

export class UserPaginatedApiResponseDto extends createStrictZodDto(createApiPaginatedResponseSchema(publicUserSelectSchema)) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Users retrieved successfully' })
    message: string;

    @ApiProperty({ type: [UserResponseDto] })
    data: UserResponseDto[];

    @ApiProperty()
    pagination: any;
}

// Re-export from zod-schemas for service layer
export type { UserInsertInput, UserUpdateInput, UserSelectOutput, PublicUserOutput };
