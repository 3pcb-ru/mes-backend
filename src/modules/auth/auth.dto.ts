import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

import { createApiResponseDto } from '@/common/helpers/api-response';
import { nameRegex, passwordRegex, resetCodeRegex, validateText } from '@/common/helpers/validations';
import { createStrictZodDto } from '@/common/helpers/zod-strict';
import { userInsertSchema } from '@/models/zod-schemas';

//Input Schemas
const signupSchema = userInsertSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        verificationToken: true,
        isVerified: true,
        roleId: true,
    })
    .extend({
        firstName: validateText({ regex: nameRegex }),
        lastName: validateText({ regex: nameRegex }),
        organizationName: validateText({ min: 2, max: 100 }),
        password: validateText({ regex: passwordRegex, min: 8, max: 50 }),
        sendMail: z.boolean().optional(),
    });

const loginSchema = z.object({
    email: z.email('Please enter a valid email address').transform((s) => s?.trim()?.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
    code: z
        .string()
        .min(1, 'Verification code is required')
        .transform((s) => s?.trim()),
    email: z.email('Please enter a valid email address').transform((s) => s?.trim()?.toLowerCase()),
});

const forgotPasswordSchema = z.object({
    email: z.email('Please enter a valid email address').transform((s) => s?.trim()?.toLowerCase()),
});

const validateResetCodeSchema = z.object({
    email: z.email('Please enter a valid email address').transform((s) => s?.trim()?.toLowerCase()),
    code: validateText({ regex: resetCodeRegex }),
});

const resetPasswordSchema = z.object({
    email: z.email('Please enter a valid email address').transform((s) => s?.trim()?.toLowerCase()),
    code: validateText({ regex: resetCodeRegex }),
    newPassword: validateText({ regex: passwordRegex, min: 8, max: 50 }),
});

const changePasswordSchema = z.object({
    oldPassword: validateText({ regex: passwordRegex }),
    newPassword: validateText({ regex: passwordRegex, min: 8, max: 50 }),
});

const resendVerificationSchema = z.object({
    email: z.email('Please enter a valid email address').transform((s) => s?.trim()?.toLowerCase()),
});

const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

const acceptInvitationSchema = z.object({
    token: z.string().min(1, 'Invitation token is required'),
    password: validateText({ regex: passwordRegex, min: 8, max: 50 }),
});

// Input DTO's
export class SignupDto extends createStrictZodDto(signupSchema) {
    @ApiProperty({ description: 'User first name', example: 'John' })
    firstName: string;

    @ApiProperty({ description: 'User last name', example: 'Doe' })
    lastName: string;

    @ApiProperty({ description: 'Organization name to create', example: 'Acme Corp' })
    organizationName: string;

    @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
    email: string;

    @ApiProperty({ description: 'User password', example: 'P@ssword123' })
    password: string;

    @ApiProperty({ description: 'Whether to send a welcome email', example: true, required: false })
    sendMail?: boolean;
}

export class LoginDto extends createStrictZodDto(loginSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'User password', example: 'P@ssword123' })
    password: string;
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

export class ValidateResetCodeDto extends createStrictZodDto(validateResetCodeSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'Reset code received via email', example: '123456' })
    code: string;
}

export class ResetPasswordDto extends createStrictZodDto(resetPasswordSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'Reset code received via email', example: '123456' })
    code: string;

    @ApiProperty({ description: 'New password to set', example: 'NewP@ssword123' })
    newPassword: string;
}

export class ChangePasswordDto extends createStrictZodDto(changePasswordSchema) {
    @ApiProperty({ description: 'Current password', example: 'OldP@ssword123' })
    oldPassword: string;

    @ApiProperty({ description: 'New password to set', example: 'NewP@ssword123' })
    newPassword: string;
}

export class ResendVerificationDto extends createStrictZodDto(resendVerificationSchema) {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;
}

export class RefreshTokenDto extends createStrictZodDto(refreshTokenSchema) {
    @ApiProperty({ description: 'Valid refresh token', example: 'refresh-token-string' })
    refreshToken: string;
}

export class AcceptInvitationDto extends createStrictZodDto(acceptInvitationSchema) {
    @ApiProperty({ description: 'Invitation token from email', example: 'invitation-token-string' })
    token: string;

    @ApiProperty({ description: 'New password to set', example: 'SetsP@ssword123' })
    password: string;
}

// Response Data Shapes
export class LoginResponseDataDto {
    @ApiProperty({ description: 'JWT Access Token' })
    accessToken: string;

    @ApiProperty({ description: 'JWT Refresh Token' })
    refreshToken: string;

    @ApiProperty({ description: 'User profile information' })
    user: any;

    @ApiProperty({ description: 'User settings', required: false })
    settings?: any | null;

    @ApiProperty({ description: 'Whether the user email is verified' })
    isVerified: boolean;
}

export class SignupResponseDataDto {
    @ApiProperty({ description: 'JWT Access Token (if auto-login)', required: false })
    accessToken?: string;

    @ApiProperty({ description: 'JWT Refresh Token (if auto-login)', required: false })
    refreshToken?: string;

    @ApiProperty({ description: 'Registered email' })
    email: string;
}

// API Response DTO's
export class LoginApiResponseDto extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Login successful' })
    message: string;

    @ApiProperty({ type: LoginResponseDataDto })
    data: LoginResponseDataDto;
}

export class SignupApiResponseDto extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Signup successful' })
    message: string;

    @ApiProperty({ type: SignupResponseDataDto })
    data: SignupResponseDataDto;
}

export class MessageApiResponseDto extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Operation successful' })
    message: string;

    @ApiProperty({ type: Object, example: { message: 'Action completed' } })
    data: { message: string };
}

export class ValidateResetCodeApiResponseDto extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Code validated' })
    message: string;

    @ApiProperty({ type: Object, example: { valid: true } })
    data: { valid: boolean };
}

export class ResendStatusApiResponseDto extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Status retrieved' })
    message: string;

    @ApiProperty({ type: Object, example: { attempts: 1, maxAttempts: 3, remaining: 2 } })
    data: { attempts: number; maxAttempts: number; remaining: number };
}

export class LoginApiResponseWithSettingsDto extends LoginApiResponseDto {}

export class RefreshTokenApiResponseDto extends createApiResponseDto(z.any()) {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Token refreshed' })
    message: string;

    @ApiProperty({ type: Object, example: { accessToken: '...', refreshToken: '...' } })
    data: { accessToken: string; refreshToken: string };
}
