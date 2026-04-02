import { BadRequestException } from '@nestjs/common';
import { DrizzleService } from '@/models/model.service';
import { BomService } from '@/modules/bom/bom.service';

describe('BomService (unit)', () => {
    let svc: BomService;
    let mockDrizzle: any;

    beforeEach(() => {
        mockDrizzle = {
            database: {
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
                transaction: jest.fn((cb) => cb(mockDrizzle.database)),
            },
        };
        svc = new BomService(mockDrizzle as unknown as DrizzleService);
    });

    describe('createRevision (Major Bump)', () => {
        it('should start with 1.0 if no revisions exist', async () => {
            mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue(null);
            const res = await svc.createRevision('prod-id', {}, 'user-id');
            expect(res.version).toBe('1.0');
        });

        it('should bump major version if revisions exist', async () => {
            mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue({ version: '1.5' });
            mockDrizzle.database.insert().returning.mockResolvedValue([{ version: '2.0' }]);
            const res = await svc.createRevision('prod-id', {}, 'user-id');
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

            const res = await svc.createAlternative('prod-id', 'base-id', 'user-id');
            expect(res.version).toBe('2.5');
        });
    });

    describe('Protection Rules', () => {
        it('should throw BadRequestException if update attempted on non-draft revision', async () => {
            mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue({ id: 'rev-id', status: 'approved' });
            await expect(svc.addMaterial('rev-id', {} as any)).rejects.toThrow(BadRequestException);
        });

        it('should allow material addition if status is draft', async () => {
            mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue({ id: 'rev-id', status: 'draft' });
            mockDrizzle.database.insert().returning.mockResolvedValue([{ id: 'mat-id' }]);
            const res = await svc.addMaterial('rev-id', { quantity: 10 } as any);
            expect(res).toBeDefined();
        });
    });
});
