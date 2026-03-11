import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { NodeController } from '@/modules/node/node.controller';
import { NodeService } from '@/modules/node/node.service';

describe('NodeController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        // Mock NodeService so we don't have to load Drizzle or AppModule
        const mockNodeService = {
            list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
            create: jest.fn().mockResolvedValue({ id: 'dummy-id' }),
            findOne: jest.fn().mockResolvedValue({ id: 'dummy-id' }),
            update: jest.fn().mockResolvedValue({ id: 'dummy-id' }),
        };

        const mod = await Test.createTestingModule({
            controllers: [NodeController],
            providers: [{ provide: NodeService, useValue: mockNodeService }],
        }).compile();

        app = mod.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/nodes (GET) - starts up successfully', async () => {
        const res = await request(app.getHttpServer()).get('/api/nodes');
        expect(res.status).toBe(200);
    });
});
