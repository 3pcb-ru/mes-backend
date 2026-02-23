import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { InventoryController } from '@/modules/inventory/inventory.controller';
import { InventoryService } from '@/modules/inventory/inventory.service';
import { FacilityService } from '@/modules/facility/facility.service';
import { TransferService } from '@/modules/inventory/services/transfer.service';

describe('InventoryController (integration)', () => {
  let app: INestApplication;
  let inventoryService: InventoryService;

  beforeAll(async () => {
    // Create a minimal test module without complex dependencies
    const moduleRef = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [InventoryService, FacilityService, TransferService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    
    inventoryService = moduleRef.get<InventoryService>(InventoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/inventory/containers (POST -> GET)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/inventory/containers')
      .send({ label: 'C1' })
      .expect(201);
    
    expect(createRes.body).toHaveProperty('_data');
    const id = createRes.body._data.id;

    const getRes = await request(app.getHttpServer())
      .get(`/api/inventory/containers/${id}`)
      .expect(200);
    
    expect(getRes.body._data.id).toBe(id);
  });
});
