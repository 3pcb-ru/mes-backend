import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

import { DEFAULT_GEMINI_MODEL } from '@/common/constants';

@Injectable()
export class AiCoreService implements OnModuleInit {
    private readonly logger = new Logger(AiCoreService.name);
    private genAI: GoogleGenerativeAI;
    private geminiModel: string;
    private geminiApiKey: string;

    constructor(private readonly configService: ConfigService) {}

    onModuleInit() {
        const aiConfig = this.configService.getOrThrow<{ geminiApiKey: string; geminiModel: string }>('server.ai');
        this.geminiModel = aiConfig.geminiModel || DEFAULT_GEMINI_MODEL;
        this.geminiApiKey = aiConfig.geminiApiKey || '';
        if (!this.geminiApiKey) {
            this.logger.warn('[AI Core] GEMINI_API_KEY is missing. AI features will be unavailable.');
            return;
        }
        this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
        this.logger.log(`[AI Core] AI Core initialized successfully with API ${this.geminiModel}`);
    }

    /**
     * Get a generative model instance with standard configuration.
     * @param modelName Model identifier (e.g., 'gemini-1.5-flash')
     */
    getModel(modelName?: string): GenerativeModel {
        if (!this.genAI) {
            throw new Error('AI Core is not initialized. Please check GEMINI_API_KEY.');
        }
        const targetModel = modelName || this.geminiModel;
        return this.genAI.getGenerativeModel({ model: targetModel });
    }

    /**
     * Standard normalization for AI errors.
     */
    normalizeError(error: unknown): string {
        const details = this.getErrorDetails(error);
        return details.message;
    }

    /**
     * Extracts detailed error information including status and retry delays.
     */
    getErrorDetails(error: unknown): { status?: number; message: string; retryAfter?: number } {
        this.logger.error('AI Generation Error:', error);

        const status = (error as { status: number })?.status;
        let message = (error as { message: string }).message || 'An unexpected error occurred during AI processing.';
        let retryAfter: number | undefined;

        if (status === 429) {
            message = 'AI quota limit exceeded. Please wait a moment for the coolDown.';

            // Extract retryDelay from Google RPC errorDetails
            const errorDetails = (error as { errorDetails?: any[] })?.errorDetails;
            const retryInfo = errorDetails?.find((d) => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
                // Parse "57s" to 57
                const seconds = parseInt(retryInfo.retryDelay, 10);
                if (!isNaN(seconds)) {
                    retryAfter = seconds;
                }
            } else {
                // Default fallback if no specific delay provided
                retryAfter = 60;
            }
        } else if (status === 503) {
            message = 'AI service is currently experiencing high demand and is temporarily unavailable. Please try again in a moment.';
        } else if (message.includes('SECURITY_VIOLATION')) {
            message =
                'Security Protocol Breach: The AI attempted to generate forbidden technical keywords (e.g., scripts, raw logic, or internal system terms). This usually happens when requesting raw code or system-level data. Please rephrase your request to focus on UI presentation and data display.';
        }

        return { status, message, retryAfter };
    }
}
