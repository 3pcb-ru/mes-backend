import { HttpException } from '@nestjs/common';

import { VibeProvider } from '../../src/modules/ai-core/vibe.provider';

describe('VibeProvider (unit)', () => {
    let provider: VibeProvider;
    let mockAiCore: any;
    let mockModel: any;

    beforeEach(() => {
        mockModel = {
            generateContent: jest.fn(),
        };

        mockAiCore = {
            getModel: jest.fn().mockReturnValue(mockModel),
            getErrorDetails: jest.fn().mockReturnValue({ status: 503, message: 'Overloaded' }),
            normalizeError: jest.fn().mockReturnValue('Normalized error'),
        };

        provider = new VibeProvider(mockAiCore as any);
    });

    describe('generateLayout', () => {
        it('should return parsed JSON if generation is successful and secure', async () => {
            const mockResponse = {
                response: {
                    text: () => '```json\n{"pages": []}\n```',
                },
            };
            mockModel.generateContent.mockResolvedValue(mockResponse);

            const result = await provider.generateLayout('test prompt', {}, {});
            expect(result).toEqual({ pages: [] });
        });

        it('should throw Error if output contains security violations', async () => {
            const mockResponse = {
                response: {
                    text: () => '```json\n{"label": "This script is bad"}\n```',
                },
            };
            mockModel.generateContent.mockResolvedValue(mockResponse);

            await expect(provider.generateLayout('test', {}, {})).rejects.toThrow('SECURITY_VIOLATION');
        });

        it('should throw HttpException for 429 errors to propagate retryAfter', async () => {
            const error = { status: 429 };
            mockModel.generateContent.mockRejectedValue(error);
            mockAiCore.getErrorDetails.mockReturnValue({
                status: 429,
                message: 'Quota exceeded',
                retryAfter: 57,
            });

            try {
                await provider.generateLayout('test', {}, {});
            } catch (err: any) {
                expect(err).toBeInstanceOf(HttpException);
                expect(err.getStatus()).toBe(429);
                expect(err.getResponse().retryAfter).toBe(57);
            }
        });
    });

    describe('validateIntent', () => {
        it('should return valid true for manufacturing requests', async () => {
            const mockResponse = {
                response: {
                    text: () => 'VALID',
                },
            };
            mockModel.generateContent.mockResolvedValue(mockResponse);

            const result = await provider.validateIntent('Create a dashboard');
            expect(result.valid).toBe(true);
        });

        it('should retry on 503 errors', async () => {
            const error = { status: 503 };
            mockModel.generateContent.mockRejectedValueOnce(error).mockResolvedValue({ response: { text: () => 'VALID' } });

            const result = await provider.validateIntent('test');
            expect(result.valid).toBe(true);
            expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
        });
    });
});
