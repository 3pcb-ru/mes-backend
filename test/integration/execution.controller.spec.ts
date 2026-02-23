import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExecutionModule } from '@/modules/execution/execution.module';

describe('ExecutionController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [ExecutionModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/work-orders (POST -> GET)', async () => {
    const createRes = await request(app.getHttpServer()).post('/api/work-orders').send({ productId: 'p1', quantity: 1 }).expect(201);
    expect(createRes.body).toHaveProperty('_data');
    const id = createRes.body._data.id;

    const getRes = await request(app.getHttpServer()).get(`/api/work-orders/${id}`).expect(200);
    expect(getRes.body._data.id).toBe(id);
  });
});
