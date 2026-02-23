import { ProductService } from '@/modules/product/product.service';

describe('ProductService (unit)', () => {
  let svc: ProductService;

  beforeEach(() => {
    svc = new ProductService();
  });

  it('creates and finds product', async () => {
    const p = await svc.create({ sku: 'SKU1', name: 'Prod 1' });
    expect(p).toHaveProperty('id');
    const found = await svc.findOne(p.id);
    expect(found.sku).toBe('SKU1');
  });
});
