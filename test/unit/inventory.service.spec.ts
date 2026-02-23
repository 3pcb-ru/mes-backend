import { InventoryService } from '@/modules/inventory/inventory.service';

describe('InventoryService (unit)', () => {
  let svc: InventoryService;

  beforeEach(() => {
    svc = new InventoryService();
  });

  it('creates and retrieves a container', async () => {
    const c = await svc.createContainer({ lpn: 'LPN123', type: 'REEL' });
    expect(c).toHaveProperty('id');
    const got = await svc.getContainer(c.id);
    expect(got.lpn).toBe('LPN123');
  });
});
