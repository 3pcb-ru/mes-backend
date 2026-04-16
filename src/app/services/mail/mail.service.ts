import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compile, TemplateDelegate } from 'handlebars';
import { createTransport, Transporter } from 'nodemailer';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { RESET_TOKEN_EXPIRY } from '@/common/constants';
import { API_CONFIG_TOKEN, IAppConfiguration } from '@/config';

import {
    EMAIL_TEMPLATE,
    ISendAdminTicketNotification,
    ISendAiAbuseMail,
    ISendInvitationMail,
    ISendMail,
    ISendOrderStatusMail,
    ISendPasswordResetMail,
    ISendTicketConfirmation,
    ISendVerificationMail,
} from './mail.interface';

@Injectable()
export class MailService {
    private readonly mailerService: Transporter;
    private readonly templateCache = new Map<EMAIL_TEMPLATE, TemplateDelegate>();
    private readonly templatePaths: string[];
    private readonly adminEmail: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(MailService.name);
        this.templatePaths = this.initializeTemplatePaths();
        this.mailerService = this.initializeMailer();
        this.adminEmail = 'info@dannie.cc';
        void this.verifyConnection();
    }

    private async verifyConnection(): Promise<void> {
        try {
            await this.mailerService.verify();
            this.logger.log('Successfully connected to email server');
        } catch (error) {
            this.logger.error('Failed to connect to email server:', error);
            throw error;
        }
    }

    // Private Methods - Initialization
    private initializeTemplatePaths(): string[] {
        return [join(process.cwd(), 'dist', 'assets', 'templates'), join(process.cwd(), 'assets', 'templates')];
    }

    private initializeMailer(): Transporter {
        try {
            const { smtp } = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);

            return createTransport({
                host: smtp.host,
                port: smtp.port,
                secure: smtp.port === 465,
                auth: {
                    user: smtp.username,
                    pass: smtp.password,
                },
                from: smtp.from,
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateLimit: 5,
            });
        } catch (error) {
            this.logger.error('Failed to initialize email service:', error);
            throw error;
        }
    }

    // Private Methods - Template Handling
    // eslint-disable-next-line no-undef
    private loadTemplate(templateName: EMAIL_TEMPLATE): HandlebarsTemplateDelegate {
        try {
            const cached = this.templateCache.get(templateName);
            if (cached) return cached;

            const template = this.findAndLoadTemplate(templateName);
            const compiled = compile(template);
            this.templateCache.set(templateName, compiled);

            return compiled;
        } catch (error) {
            this.logger.error(`Failed to load template ${templateName}:`, error);
            throw new PreconditionFailedException(`Email template ${templateName} not found`);
        }
    }

    private findAndLoadTemplate(templateName: EMAIL_TEMPLATE): string {
        let lastError: Error | null = null;

        for (const basePath of this.templatePaths) {
            try {
                const fullPath = join(basePath, `${templateName}.hbs`);
                this.logger.debug(`Attempting to load template from: ${fullPath}`);
                return readFileSync(fullPath, 'utf8');
            } catch (error) {
                lastError = error;
                continue;
            }
        }

        throw new Error(`Template not found in any location. Last error: ${lastError?.message}`);
    }

    private fillTemplate(templateName: EMAIL_TEMPLATE, context: Record<string, string>): string {
        try {
            const template = this.loadTemplate(templateName);
            return template(context);
        } catch (error) {
            this.logger.error(`Failed to fill template ${templateName}:`, error);
            throw new PreconditionFailedException(`Failed to process email template ${templateName}`);
        }
    }

    // Public Methods
    public async sendVerification(data: ISendVerificationMail): Promise<void> {
        const { email, name, code } = data;

        try {
            const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);
            const baseUrl = configuration.server.url;
            this.logger.log('baseUrl', baseUrl);

            const htmlContent = this.fillTemplate(EMAIL_TEMPLATE.VERIFICATION, {
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
                name,
                code,
                email: encodeURIComponent(email),
                expires_in: (RESET_TOKEN_EXPIRY / 60).toString(), // Convert seconds to minutes
            });
            const mailData: ISendMail = {
                to: email,
                subject: 'Verify Your Email - GRVT MES',
                html: htmlContent,
            };

            // this.logger.log('mailData', mailData);

            await this.sendMail(mailData);
            this.logger.log(`Verification email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${email}:`, error);
            throw new PreconditionFailedException('Failed to send verification email');
        }
    }

    public async sendMail(data: ISendMail): Promise<void> {
        try {
            const { smtp } = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);
            const mailOptions = { ...data, from: data.from || smtp.from };

            const res = await this.mailerService.sendMail(mailOptions);
            this.logger.log('send mail response', res);
        } catch (error) {
            this.logger.error('Error sending email:', error);
            throw new PreconditionFailedException('Failed to send email');
        }
    }

    public async sendPasswordReset(data: ISendPasswordResetMail): Promise<void> {
        const { email, name, resetToken, resetUrl } = data;

        try {
            const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);
            const htmlContent = this.fillTemplate(EMAIL_TEMPLATE.PASSWORD_RESET, {
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
                name,
                resetToken,
                resetUrl,
                email,
                expires_in: (RESET_TOKEN_EXPIRY / 60).toString(), // Convert seconds to minutes
            });
            const mailData: ISendMail = {
                to: email,
                subject: 'Reset Your Password - GRVT MES',
                html: htmlContent,
            };

            await this.sendMail(mailData);
            this.logger.debug(`Reset password email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send reset password email to ${email}:`, error);
            throw new PreconditionFailedException('Failed to send reset password email');
        }
    }

    public async sendTicketConfirmation(data: ISendTicketConfirmation): Promise<void> {
        const { email, name, ticketNumber, status } = data;

        try {
            const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);
            const baseUrl = configuration.server.url;
            const serverBaseUrl = configuration.server.url;
            this.logger.log('baseUrl', baseUrl);

            const htmlContent = this.fillTemplate(EMAIL_TEMPLATE.TICKET_CREATION, {
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
                serverBaseUrl,
                name: name || '',
                ticketNumber,
                email: encodeURIComponent(email),
                status: status,
                // expires_in: (RESET_TOKEN_EXPIRY / 60).toString(), // Convert seconds to minutes
            });
            const mailData: ISendMail = {
                to: email,
                subject: `We have Received Your Request - Ticket #${ticketNumber} - GRVT MES`,
                html: htmlContent,
            };

            // this.logger.log('mailData', mailData);

            await this.sendMail(mailData);
            this.logger.log(`Ticket confirmation email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send ticket confirmation email to ${email}:`, error);
            throw new PreconditionFailedException('Failed to send ticket confirmation email');
        }
    }

    // Order Status
    public async sendOrderNotification(data: ISendOrderStatusMail): Promise<void> {
        const { email, name } = data;
        try {
            const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);
            const clientUrl = configuration.client.url;

            const orderUrl = `${clientUrl}/orders`;

            const orderDetails = {
                stageName: data.stageName,
                status: data.status,
                details: data.details || '',
                orderUrl: orderUrl,
            };
            const htmlContent = this.fillTemplate(EMAIL_TEMPLATE.ORDER_STATUS, {
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
                name,
                email,
                ...orderDetails,
            });
            const mailData: ISendMail = {
                to: email,
                subject: 'Update on Your Order Status - GRVT MES',
                html: htmlContent,
            };

            await this.sendMail(mailData);
            this.logger.debug(`Order status email has been sent to: ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send order status email to ${email}:`, error);
            throw new PreconditionFailedException('Failed to send order status email');
        }
    }

    // {* INTERNAL METHODS FOR ADMIN *}
    public async sendAdminTicketNotification(data: ISendAdminTicketNotification): Promise<void> {
        const { ticketId, ticketNumber, ticketType, customerName, customerEmail, ticketSubject, createdAt } = data;

        try {
            const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);

            const htmlContent = this.fillTemplate(EMAIL_TEMPLATE.ADMIN_TICKET_NOTIFICATION, {
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
                ticketId,
                ticketNumber,
                ticketType,
                customerName,
                customerEmail: encodeURIComponent(customerEmail),
                ticketSubject: ticketSubject || 'No subject provided',
                createdAt,
            });
            const mailData: ISendMail = {
                to: this.adminEmail,
                subject: `New Support Ticket - #${ticketNumber} from ${customerName}`,
                html: htmlContent,
            };

            // this.logger.log('Admin ticket notification data', mailData);

            await this.sendMail(mailData);
            this.logger.log(`Admin ticket notification sent to ${this.adminEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send admin ticket notification:`, error);
            throw new PreconditionFailedException('Failed to send admin ticket notification');
        }
    }

    public async sendInvitation(data: ISendInvitationMail): Promise<void> {
        const { email, firstName, lastName, organizationName, inviterName, roleName, invitationUrl } = data;

        try {
            const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);

            const htmlContent = this.fillTemplate(EMAIL_TEMPLATE.INVITATION, {
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
                email,
                firstName,
                lastName,
                organizationName,
                inviterName,
                roleName,
                invitationUrl,
            });

            const mailData: ISendMail = {
                to: email,
                subject: `Invitation to join ${organizationName} - GRVT MES`,
                html: htmlContent,
            };

            await this.sendMail(mailData);
            this.logger.log(`Invitation email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send invitation email to ${email}:`, error);
            throw new PreconditionFailedException('Failed to send invitation email');
        }
    }

    public async sendAiAbuseNotification(data: ISendAiAbuseMail): Promise<void> {
        const { email, name } = data;

        try {
            const configuration = this.configService.getOrThrow<IAppConfiguration>(API_CONFIG_TOKEN);

            // 1. Send to user
            const userHtml = this.fillTemplate(EMAIL_TEMPLATE.AI_ABUSE_USER, {
                ...data,
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
            });
            await this.sendMail({
                to: email,
                subject: 'AI Agent Access Restricted - GRVT MES Security',
                html: userHtml,
            });

            // 2. Send to admin (info@grvt.cc)
            const adminHtml = this.fillTemplate(EMAIL_TEMPLATE.AI_ABUSE_ADMIN, {
                ...data,
                baseUrl: configuration.client.url,
                serverUrl: configuration.server.url,
            });
            await this.sendMail({
                to: 'info@grvt.cc',
                subject: `🚨 Security Alert: AI Abuse Detected (${email})`,
                html: adminHtml,
            });

            this.logger.log(`Abuse notification emails sent for user ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send abuse notifications for ${email}:`, error);
            // Non-blocking error for the main flow
        }
    }
}
