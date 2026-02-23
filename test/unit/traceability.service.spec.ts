import { TraceabilityService } from '@/modules/traceability/traceability.service';

describe('TraceabilityService (unit)', () => {
  let svc: TraceabilityService;

  beforeEach(() => {
    svc = new TraceabilityService();
  });

  it('creates activity log entry', async () => {
    const e = await svc.create({ actionType: 'START', metadata: { foo: 'bar' } });
    expect(e).toHaveProperty('id');
    const list = await svc.list();
    expect(list.data.length).toBeGreaterThan(0);
  });
});
