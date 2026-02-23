import { boolean, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './iam';
import { items } from './inventory';

export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
});

export const bomRevisions = pgTable('bom_revisions', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id),
    revisionCode: text('revision_code').notNull(),
    status: text('status').default('DRAFT'),
    isActive: boolean('is_active').default(false),
});

export const bomItems = pgTable('bom_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    bomRevisionId: uuid('bom_revision_id').references(() => bomRevisions.id),
    itemId: uuid('item_id').references(() => items.id),
    designator: text('designator'),
    quantity: numeric('quantity', { precision: 10, scale: 4 }),
});
