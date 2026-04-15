import { BadRequestException } from '@nestjs/common';

import { DrizzleService } from '../../src/models/model.service';
import { ProductService } from '../../src/modules/product/product.service';

describe('ProductService (unit) - Deletion Logic', () => {
    let svc: ProductService;
    let mockDrizzle: any;

    beforeEach(() => {
        const mockDb: any = {
            delete: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'mock-id' }]),
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            forUpdate: jest.fn().mockReturnThis(),
            query: {
                bomRevision: {
                    findFirst: jest.fn(),
                },
            },
            transaction: jest.fn((cb) => cb(mockDb)),
        };
        // Setup mockDb as an iterator for findFirst/select results if needed
        mockDb.then = async (onRes: any) => Promise.resolve([{ id: 'mock-id' }]).then(onRes);

        mockDrizzle = {
            database: mockDb,
        };
        const mockLogger = { setContext: jest.fn(), log: jest.fn(), error: jest.fn() } as any;
        const mockPolicy = { read: jest.fn(), update: jest.fn(), delete: jest.fn() } as any;
        const mockTraceability = { recordChange: jest.fn() } as any;
        const mockFilterService = { handle: jest.fn() } as any;

        svc = new ProductService(mockDrizzle as unknown as DrizzleService, mockLogger, mockPolicy, mockTraceability, mockFilterService);
    });

    it('should throw BadRequestException if product has active revision', async () => {
        mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue({ id: 'rev-id', status: 'active' });
        await expect(svc.delete('prod-id', { id: 'user-id', organizationId: 'org-id' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should allow deletion if product has no active revision', async () => {
        mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue(null);
        const res = await svc.delete('prod-id', { id: 'user-id', organizationId: 'org-id' } as any);
        expect(res).toBeDefined();
    });
});
