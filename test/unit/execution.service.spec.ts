import { ExecutionService } from '@/modules/execution/execution.service';

describe('ExecutionService (unit)', () => {
  let svc: ExecutionService;

  beforeEach(() => {
    svc = new ExecutionService();
  });

  it('creates a work order and retrieves it', async () => {
    const o = await svc.createWorkOrder({ bomRevisionId: 'b1', targetQuantity: 10 });
    expect(o).toHaveProperty('id');
    const got = await svc.getWorkOrder(o.id);
    expect(got.bomRevisionId).toBe('b1');
  });
});
