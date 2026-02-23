import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { DrizzleService } from '@/models/model.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ProductModule } from '@/modules/product/product.module';

const mockDrizzleService = {
    database: {
        query: {
            product: {
                findFirst: jest.fn().mockResolvedValue({ id: 'mock-id' }),
            },
        },
        insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([{ id: 'mock-id' }]),
            }),
        }),
    },
};

describe('ProductController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const mod = await Test.createTestingModule({ imports: [ProductModule] })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { id: 'test-user', factoryId: '00000000-0000-0000-0000-000000000000', roleId: 'role-1', permissions: [] };
                    return true;
                },
            })
            .overrideProvider(DrizzleService)
            .useValue(mockDrizzleService)
            .compile();
        app = mod.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/products (POST -> GET)', async () => {
        // To avoid foreign key constraints failing on 'factoryId', we can mock the ProductService
        // Alternatively, if we test true DB, we need a real factory.
        // Let's use the actual DB but test might fail if the factory doesn't exist.
        const createRes = await request(app.getHttpServer()).post('/api/products').send({ name: 'P1', sku: 'SKU-1' }).expect(201);
        expect(createRes.body).toHaveProperty('_data');
        const id = createRes.body._data.id;

        const getRes = await request(app.getHttpServer()).get(`/api/products/${id}`).expect(200);
        expect(getRes.body._data.id).toBe('mock-id');
    });
});
