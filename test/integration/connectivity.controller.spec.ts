import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ConnectivityController } from '@/modules/connectivity/connectivity.controller';
import { ConnectivityService } from '@/modules/connectivity/connectivity.service';

describe('ConnectivityController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const mod = await Test.createTestingModule({
            controllers: [ConnectivityController],
            providers: [ConnectivityService],
        }).compile();
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
