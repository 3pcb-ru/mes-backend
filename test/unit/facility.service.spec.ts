import { FacilityService } from '@/modules/facility/facility.service';

describe('FacilityService (unit)', () => {
  let svc: FacilityService;

  beforeEach(() => {
    svc = new FacilityService();
  });

  it('creates and finds a facility node', async () => {
    const created = await svc.create({ path: 'Factory.Line.1', name: 'Line 1' });
    expect(created).toHaveProperty('id');

    const found = await svc.findOne(created.id);
    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Line 1');
  });

  it('updates a facility node', async () => {
    const created = await svc.create({ path: 'F.L.2', name: 'L2' });
    const updated = await svc.update(created.id, { name: 'Line 2' });
    expect(updated.name).toBe('Line 2');
  });
});
