import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FacilityController } from '@/modules/facility/facility.controller';
import { FacilityService } from '@/modules/facility/facility.service';

describe('FacilityController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const mod = await Test.createTestingModule({
            controllers: [FacilityController],
            providers: [FacilityService],
        }).compile();
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
