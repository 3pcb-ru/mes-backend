import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { DrizzleService } from '@/models/model.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ProductController } from '@/modules/product/product.controller';
import { ProductService } from '@/modules/product/product.service';

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
        update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([{ id: 'mock-id', name: 'P2', sku: 'SKU-2' }]),
                }),
            }),
        }),
    },
};

describe('ProductController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const mod = await Test.createTestingModule({
            controllers: [ProductController],
            providers: [ProductService, { provide: DrizzleService, useValue: mockDrizzleService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { id: 'test-user', organizationId: '00000000-0000-0000-0000-000000000000', roleId: 'role-1', permissions: [] };
                    return true;
                },
            })
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

    it('/api/products (PUT)', async () => {
        const updateRes = await request(app.getHttpServer()).put('/api/products/mock-id').send({ name: 'P2', sku: 'SKU-2' }).expect(200);
        expect(updateRes.body).toHaveProperty('_data');
        expect(updateRes.body._data.id).toBe('mock-id');
        expect(updateRes.body._data.name).toBe('P2');
        expect(updateRes.body._data.sku).toBe('SKU-2');
    });
});
