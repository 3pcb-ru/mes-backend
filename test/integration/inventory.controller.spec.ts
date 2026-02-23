import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { FacilityModule } from '@/modules/facility/facility.module';

describe('InventoryController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
  const mod = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
        ignoreEnvFile: true,
      }),
      FacilityModule,
      InventoryModule,
    ],
  }).compile();
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
