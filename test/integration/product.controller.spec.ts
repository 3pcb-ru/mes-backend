import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ProductModule } from '@/modules/product/product.module';

describe('ProductController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [ProductModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/products (POST -> GET)', async () => {
    const createRes = await request(app.getHttpServer()).post('/api/products').send({ name: 'P1' }).expect(201);
    expect(createRes.body).toHaveProperty('_data');
    const id = createRes.body._data.id;

    const getRes = await request(app.getHttpServer()).get(`/api/products/${id}`).expect(200);
    expect(getRes.body._data.id).toBe(id);
  });
});
