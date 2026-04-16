import { AiCoreService } from '../../src/modules/ai-core/ai-core.service';

describe('AiCoreService (unit)', () => {
    let svc: AiCoreService;
    let mockConfigService: any;

    beforeEach(() => {
        mockConfigService = {
            getOrThrow: jest.fn().mockReturnValue({
                geminiApiKey: 'test-api-key',
                geminiModel: 'gemini-1.5-flash',
            }),
        };

        svc = new AiCoreService(mockConfigService as any);
        // Note: genAI is private and initialized in onModuleInit
        // For unit testing normalizeError/getErrorDetails, we don't necessarily need genAI initialized
    });

    describe('getErrorDetails', () => {
        it('should correctly handle 429 quota errors and extract retryDelay', () => {
            const error = {
                status: 429,
                message: 'Quota exceeded',
                errorDetails: [
                    {
                        '@type': 'type.googleapis.com/google.rpc.RetryInfo',
                        retryDelay: '57s',
                    },
                ],
            };

            const details = svc.getErrorDetails(error);

            expect(details.status).toBe(429);
            expect(details.message).toContain('quota limit exceeded');
            expect(details.retryAfter).toBe(57);
        });

        it('should use default retryAfter for 429 if retryDelay is missing', () => {
            const error = {
                status: 429,
                message: 'Quota exceeded',
            };

            const details = svc.getErrorDetails(error);

            expect(details.retryAfter).toBe(60);
        });

        it('should return service unavailable message for 503 errors', () => {
            const error = {
                status: 503,
                message: 'Model overloaded',
            };

            const details = svc.getErrorDetails(error);

            expect(details.status).toBe(503);
            expect(details.message).toContain('high demand');
        });

        it('should normalize SECURITY_VIOLATION errors with instructional messages', () => {
            const error = {
                message: 'SECURITY_VIOLATION: Forbidden term "script" found',
            };

            const details = svc.getErrorDetails(error);

            expect(details.message).toContain('Security Protocol Breach');
            expect(details.message).toContain('forbidden technical keywords');
        });

        it('should return a generic message for unknown errors', () => {
            const error = new Error('Random failure');
            const details = svc.getErrorDetails(error);

            expect(details.message).toBe('Random failure');
        });
    });

    describe('normalizeError', () => {
        it('should return the message string from getErrorDetails', () => {
            const error = { status: 503, message: 'Overloaded' };
            const message = svc.normalizeError(error);
            expect(message).toContain('high demand');
        });
    });
});
