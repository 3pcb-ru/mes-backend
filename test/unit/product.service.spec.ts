import { DrizzleService } from '@/models/model.service';
import { ProductService } from '@/modules/product/product.service';

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
        svc = new ProductService(mockDrizzle as unknown as DrizzleService);
    });

    it('creates and finds product', async () => {
        const p = await svc.create({ sku: 'SKU1', name: 'Prod 1' }, 'factory-id');
        expect(p).toHaveProperty('id');
        const found = await svc.findOne(p.id);
        expect(found.sku).toBe('SKU1');
    });
});
