import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { AuthDecorators } from './auth.decorators';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RefreshTokenDto, ResendVerificationDto, ResetPasswordDto, SignupDto, ValidateResetCodeDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(AuthController.name);
    }

    @Post('signup')
    @AuthDecorators('signup')
    async signup(@Body() signupDto: SignupDto) {
        const result = await this.authService.signup(signupDto);
        return ok(result).message(result.message);
    }

    @Get('verify/:token')
    @AuthDecorators('verifyEmail')
    async verifyEmail(@Param('token') token: string) {
        const result = await this.authService.verifyEmail(token);
        return ok(result).message(result.message);
    }
    @Post('login')
    @AuthDecorators('login')
    async login(@Body() loginDto: LoginDto) {
        const result = await this.authService.login(loginDto);
        console.info(result);
        return ok(result).message('Logged in successfully!');
    }

    @Post('refresh')
    @AuthDecorators('refreshToken')
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
        return ok(result).message('Token refreshed successfully!');
    }

    @UseGuards(JwtAuthGuard)
    @Delete('logout')
    @AuthDecorators('logout')
    async logout(@CurrentUser() user: JwtUser) {
        // The user object is automatically populated by the JwtAuthGuard
        const result = await this.authService.logout(user.id);
        return ok(result).message(result.message);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @AuthDecorators('changePassword')
    async changePassword(@Body() changePasswordDto: ChangePasswordDto, @CurrentUser() user: JwtUser) {
        const result = await this.authService.changePassword(user.id, user.email, changePasswordDto);
        return ok(result).message(result.message ? result.message : 'Passsword changed successfully!');
    }

    @UseGuards(RateLimitGuard)
    @Post('password/reset-link')
    @AuthDecorators('forgotPassword')
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        const result = await this.authService.forgotPassword(forgotPasswordDto);
        return ok(result).message(result.message);
    }
    //
    @UseGuards(RateLimitGuard)
    @Post('validate-reset-code')
    @AuthDecorators('validateResetCode')
    async validateResetCode(@Body() validateResetCodeDto: ValidateResetCodeDto) {
        const result = await this.authService.validateResetCode(validateResetCodeDto);
        return ok(result.data).message(result.message);
    }

    @UseGuards(RateLimitGuard)
    @Post('/password/reset-password')
    @AuthDecorators('resetPassword')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        const result = await this.authService.resetPassword(resetPasswordDto);
        return ok(result).message(result.message);
    }
    /**  api */
    @UseGuards(RateLimitGuard)
    @Post('resend-verification')
    @AuthDecorators('resendVerification')
    async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
        const result = await this.authService.resendVerificationEmail(resendVerificationDto.email);
        return ok(result.data).message(result.message ?? 'Verification email sent');
    }

    @Get('resend-verification/status/:email')
    @AuthDecorators('resendStatus')
    async getResendVerificationStatus(@Param('email') email: string) {
        const result = await this.authService.getResendVerificationStatus(email);
        return ok(result).message('Resend status fetched successfully');
    }
}
