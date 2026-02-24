import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { FacilityModule } from '@/modules/facility/facility.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';

describe('InventoryController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const mod = await Test.createTestingModule({
            imports: [FacilityModule, InventoryModule],
            providers: [
                {
                    provide: CustomLoggerService,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        setContext: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        app = mod.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/inventory/containers (POST -> GET)', async () => {
        const createRes = await request(app.getHttpServer()).post('/api/inventory/containers').send({ label: 'C1' }).expect(201);
        expect(createRes.body).toHaveProperty('_data');
        const id = createRes.body._data.id;

        const getRes = await request(app.getHttpServer()).get(`/api/inventory/containers/${id}`).expect(200);
        expect(getRes.body._data.id).toBe(id);
    });
});
