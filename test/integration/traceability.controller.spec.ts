import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { TraceabilityModule } from '@/modules/traceability/traceability.module';

describe('TraceabilityController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const mod = await Test.createTestingModule({ imports: [TraceabilityModule] }).compile();
        app = mod.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/trace/activities (POST -> GET)', async () => {
        const createRes = await request(app.getHttpServer()).post('/api/trace/activities').send({ source: 'S', message: 'm' }).expect(201);
        expect(createRes.body).toHaveProperty('_data');
        const id = createRes.body._data.id;

        const getRes = await request(app.getHttpServer()).get(`/api/trace/activities/${id}`).expect(200);
        expect(getRes.body._data.id).toBe(id);
    });
});
