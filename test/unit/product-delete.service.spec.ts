import { BadRequestException } from '@nestjs/common';
import { DrizzleService } from '@/models/model.service';
import { ProductService } from '@/modules/product/product.service';

describe('ProductService (unit) - Deletion Logic', () => {
    let svc: ProductService;
    let mockDrizzle: any;

    beforeEach(() => {
        mockDrizzle = {
            database: {
                delete: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([{ id: 'mock-id' }]),
                query: {
                    bomRevision: {
                        findFirst: jest.fn(),
                    },
                },
            },
        };
        svc = new ProductService(mockDrizzle as unknown as DrizzleService);
    });

    it('should throw BadRequestException if product has active revision', async () => {
        mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue({ id: 'rev-id', status: 'active' });
        await expect(svc.delete('prod-id')).rejects.toThrow(BadRequestException);
    });

    it('should allow deletion if product has no active revision', async () => {
        mockDrizzle.database.query.bomRevision.findFirst.mockResolvedValue(null);
        const res = await svc.delete('prod-id');
        expect(res).toBeDefined();
    });
});
