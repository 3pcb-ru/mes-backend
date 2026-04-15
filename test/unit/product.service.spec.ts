import { DrizzleService } from '../../src/models/model.service';
import { ProductService } from '../../src/modules/product/product.service';

describe('ProductService (unit)', () => {
    let svc: ProductService;
    let mockDrizzle: any;

    beforeEach(() => {
        mockDrizzle = {
            database: {
                insert: jest.fn().mockReturnThis(),
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([{ id: 'mock-id', sku: 'SKU1', name: 'Prod 1' }]),
                query: {
                    product: {
                        findFirst: jest.fn().mockResolvedValue({ id: 'mock-id', sku: 'SKU1', name: 'Prod 1' }),
                        findMany: jest.fn().mockResolvedValue([{ id: 'mock-id', sku: 'SKU1', name: 'Prod 1' }]),
                    },
                },
            },
        };
        const mockLogger = { setContext: jest.fn(), log: jest.fn(), error: jest.fn() } as any;
        const mockPolicy = { read: jest.fn(), update: jest.fn(), delete: jest.fn() } as any;
        const mockTraceability = { recordChange: jest.fn() } as any;
        const mockFilterService = { handle: jest.fn() } as any;

        svc = new ProductService(mockDrizzle as unknown as DrizzleService, mockLogger, mockPolicy, mockTraceability, mockFilterService);
    });

    it('creates and finds product', async () => {
        const p = await svc.create({ sku: 'SKU1', name: 'Prod 1' }, { id: 'user-id', organizationId: 'factory-id' } as any);
        expect(p).toHaveProperty('id');
        const found = await svc.findOne(p.id, { id: 'user-id', organizationId: 'factory-id' } as any);
        expect(found.sku).toBe('SKU1');
    });
});
