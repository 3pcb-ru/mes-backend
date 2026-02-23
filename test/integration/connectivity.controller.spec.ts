import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ConnectivityModule } from '@/modules/connectivity/connectivity.module';

describe('ConnectivityController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const mod = await Test.createTestingModule({ imports: [ConnectivityModule] }).compile();
        app = mod.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/connectivity/mqtt/ingest (POST)', async () => {
        const payload = { nodeId: 'n1', topic: 'sensors/temp', payload: {} };
        const res = await request(app.getHttpServer()).post('/api/connectivity/mqtt/ingest').send(payload).expect(201);
        expect(res.body).toHaveProperty('_data');
    });
});
