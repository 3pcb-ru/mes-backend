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
        this.logger.log('[AI Core] AI Core initialized successfully with API version v1.');
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
        return this.genAI.getGenerativeModel({ model: targetModel }, { apiVersion: 'v1' });
    }

    /**
     * Standard normalization for AI errors.
     */
    normalizeError(error: unknown): string {
        this.logger.error('AI Generation Error:', error);
        if ((error as { status: number }).status === 429) {
            return 'AI rate limit exceeded. Please try again in a few moments.';
        }
        return (error as { message: string }).message || 'An unexpected error occurred during AI processing.';
    }
}
