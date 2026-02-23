import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { FacilityModule } from '@/modules/facility/facility.module';

describe('FacilityController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [FacilityModule] }).compile();
        app = mod.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/facilities (POST -> GET)', async () => {
        const createRes = await request(app.getHttpServer()).post('/api/facilities').send({ path: 'T.L.1', name: 'T1' }).expect(201);
        expect(createRes.body).toHaveProperty('_data');
        const id = createRes.body._data.id;

        const getRes = await request(app.getHttpServer()).get(`/api/facilities/${id}`).expect(200);
        expect(getRes.body._data.id).toBe(id);
    });
});
