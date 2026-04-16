import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { VibeService } from '../../src/modules/vibe/vibe.service';
import { JwtUser } from '../../src/types/jwt.types';

describe('VibeService (unit)', () => {
    let svc: VibeService;
    let mockDrizzle: any;
    let mockFilterService: any;
    let mockVibeProvider: any;
    let mockPolicy: any;
    let mockMailService: any;
    let mockTraceability: any;

    const mockUser: JwtUser = {
        id: 'user-id',
        email: 'test@example.com',
        roleId: 'role-id',
        organizationId: 'org-id',
        permissions: [],
    };

    beforeEach(() => {
        mockDrizzle = {
            database: {
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockImplementation(() => {
                    const res: any = [
                        {
                            id: 'user-id',
                            email: 'test@example.com',
                            vibeBlockedUntil: null,
                            vibeFailCount: 0,
                        },
                    ];
                    return res;
                }),
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([{ id: 'new-page-id' }]),
                delete: jest.fn().mockReturnThis(),
            },
        };

        mockFilterService = {
            filterable: jest.fn().mockReturnThis(),
        };

        mockVibeProvider = {
            validateIntent: jest.fn().mockResolvedValue({ valid: true }),
            generateLayout: jest.fn().mockResolvedValue({ layout: {} }),
        };

        mockPolicy = {
            canReadRecord: jest.fn().mockReturnValue(true),
            canWriteRecord: jest.fn().mockReturnValue(true),
        };

        mockMailService = {
            sendAiAbuseNotification: jest.fn(),
        };

        mockTraceability = {
            recordChange: jest.fn().mockResolvedValue({}),
        };

        svc = new VibeService(mockDrizzle as any, mockFilterService as any, mockVibeProvider as any, mockPolicy as any, mockMailService as any, mockTraceability as any);
    });

    describe('generateLayout', () => {
        it('should generate layout if intent is valid', async () => {
            const dto = { prompt: 'Valid prompt', apiManifest: {}, componentsManifest: {} };
            const result = await svc.generateLayout(mockUser, dto as any);

            expect(result).toBeDefined();
            expect(mockVibeProvider.generateLayout).toHaveBeenCalled();
        });

        it('should throw ForbiddenException if user is blocked', async () => {
            mockDrizzle.database.where.mockReturnValue([{ id: 'user-id', vibeBlockedUntil: new Date(Date.now() + 100000) }]);

            const dto = { prompt: 'Valid prompt', apiManifest: {}, componentsManifest: {} };
            await expect(svc.generateLayout(mockUser, dto as any)).rejects.toThrow(ForbiddenException);
        });

        it('should increment fail count and throw if intent is invalid', async () => {
            mockVibeProvider.validateIntent.mockResolvedValue({ valid: false, reason: 'Bad intent' });

            const dto = { prompt: 'Invalid prompt', apiManifest: {}, componentsManifest: {} };
            await expect(svc.generateLayout(mockUser, dto as any)).rejects.toThrow(ForbiddenException);
            expect(mockDrizzle.database.update).toHaveBeenCalled();
        });
    });

    describe('createPage', () => {
        it('should insert a new page and record a traceability change', async () => {
            const dto = { name: 'Test Page', category: 'Custom', config: {}, isOwnerCreated: false };
            const result = await svc.createPage(mockUser, dto as any);

            expect(result.id).toBe('new-page-id');
            expect(mockDrizzle.database.insert).toHaveBeenCalled();
            expect(mockTraceability.recordChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityType: 'VibePage',
                    action: 'CREATE',
                }),
                mockUser,
            );
        });
    });

    describe('deletePage', () => {
        it('should delete existing page and record change if user has permission', async () => {
            // Mock finding the page
            mockDrizzle.database.where.mockReturnValue([{ id: 'page-id', organizationId: 'org-id' }]);

            await svc.deletePage(mockUser, 'page-id');

            expect(mockDrizzle.database.delete).toHaveBeenCalled();
            expect(mockTraceability.recordChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityType: 'VibePage',
                    action: 'DELETE',
                }),
                mockUser,
            );
        });

        it('should throw NotFoundException if page does not exist', async () => {
            mockDrizzle.database.where.mockReturnValue([]);
            await expect(svc.deletePage(mockUser, 'page-id')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if policy denies deletion', async () => {
            mockDrizzle.database.where.mockReturnValue([{ id: 'page-id' }]);
            mockPolicy.canWriteRecord.mockReturnValue(false);

            await expect(svc.deletePage(mockUser, 'page-id')).rejects.toThrow(ForbiddenException);
        });
    });
});
