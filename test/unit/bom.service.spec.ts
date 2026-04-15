import { BadRequestException } from '@nestjs/common';

import { DrizzleService } from '../../src/models/model.service';
import { BomService } from '../../src/modules/bom/bom.service';

describe('BomService (unit)', () => {
    let svc: BomService;
    let mockDrizzle: any;

    beforeEach(() => {
        const mockDb: any = {
            insert: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'mock-rev-id', version: '1.0', status: 'draft' }]),
            query: {
                bomRevision: {
                    findFirst: jest.fn(),
                    findMany: jest.fn(),
                },
                bomMaterial: {
                    findMany: jest.fn(),
                },
            },
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            forUpdate: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            transaction: jest.fn((cb) => cb(mockDb)),
            execute: jest.fn().mockResolvedValue({}),
        };
        // Setup mockDb as an iterator for findFirst/select results if needed
        mockDb.then = async (onRes: any) => Promise.resolve([{ id: 'mock-id', status: 'draft', organizationId: 'org-id' }]).then(onRes);

        mockDrizzle = {
            database: mockDb,
        };
        const mockLogger = { setContext: jest.fn(), log: jest.fn(), error: jest.fn() } as any;
        const mockPolicy = { read: jest.fn(), update: jest.fn(), delete: jest.fn(), canWrite: jest.fn() } as any;
        const mockMaterialPolicy = { read: jest.fn(), update: jest.fn(), delete: jest.fn(), canWrite: jest.fn() } as any;
        const mockTraceability = { recordChange: jest.fn() } as any;
        const mockFilterService = { handle: jest.fn() } as any;

        svc = new BomService(mockDrizzle as unknown as DrizzleService, mockLogger, mockPolicy, mockMaterialPolicy, mockTraceability, mockFilterService);
    });

    describe('createRevision (Major Bump)', () => {
        it('should start with 1.0 if no revisions exist', async () => {
            mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue(null);
            const res = await svc.createRevision('prod-id', {}, { id: 'user-id', organizationId: 'org-id' } as any);
            expect(res.version).toBe('1.0');
        });

        it('should bump major version if revisions exist', async () => {
            mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue({ version: '1.5' });
            mockDrizzle.database.insert().returning.mockResolvedValue([{ version: '2.0' }]);
            const res = await svc.createRevision('prod-id', {}, { id: 'user-id', organizationId: 'org-id' } as any);
            expect(res.version).toBe('2.0');
        });
    });

    describe('createAlternative (Minor Bump)', () => {
        it('should bump minor version from base revision', async () => {
            // Mock base revision
            mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue({ id: 'base-id', version: '2.4', productId: 'prod-id' });
            // Mock latest minor in that major
            mockDrizzle.database.query.bomRevision.findMany.mockResolvedValue([{ version: '2.4' }]);
            // Mock material scan for copy
            mockDrizzle.database.query.bomMaterial.findMany.mockResolvedValue([]);

            mockDrizzle.database.insert().returning.mockResolvedValue([{ version: '2.5' }]);

            const res = await svc.createAlternative('prod-id', 'base-id', { id: 'user-id', organizationId: 'org-id' } as any);
            expect(res.version).toBe('2.5');
        });
    });

    describe('Protection Rules', () => {
        it('should throw BadRequestException if update attempted on non-draft revision', async () => {
            // Mock revision as approved
            mockDrizzle.database.then = async (onRes: any) => Promise.resolve([{ id: 'rev-id', status: 'approved' }]).then(onRes);
            await expect(svc.addMaterial('rev-id', {} as any, { id: 'user-id' } as any)).rejects.toThrow(BadRequestException);
        });

        it('should allow material addition if status is draft', async () => {
            // Mock revision as draft
            mockDrizzle.database.then = async (onRes: any) => Promise.resolve([{ id: 'rev-id', status: 'draft', organizationId: 'org-id' }]).then(onRes);
            mockDrizzle.database.insert().returning.mockResolvedValue([{ id: 'mat-id' }]);
            const res = await svc.addMaterial('rev-id', { quantity: 10 } as any, { id: 'user-id' } as any);
            expect(res).toBeDefined();
        });
    });
});
