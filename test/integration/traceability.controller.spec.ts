import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TraceabilityController } from '@/modules/traceability/traceability.controller';
import { TraceabilityService } from '@/modules/traceability/traceability.service';

describe('TraceabilityController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        // Create a minimal test module without complex dependencies
        const moduleRef = await Test.createTestingModule({
            controllers: [TraceabilityController],
            providers: [TraceabilityService],
        }).compile();

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/trace/activities (POST -> GET)', async () => {
        const createRes = await request(app.getHttpServer())
            .post('/api/trace/activities')
            .send({ source: 'S', message: 'm' })
            .expect(201);
        
        expect(createRes.body).toHaveProperty('_data');
        const id = createRes.body._data.id;

        const getRes = await request(app.getHttpServer())
            .get(`/api/trace/activities/${id}`)
            .expect(200);
        
        expect(getRes.body._data.id).toBe(id);
    });
});
