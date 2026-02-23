import { integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { facilities } from './facilities';
import { tenants } from './iam';

export const containers = pgTable('containers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    locationNodeId: uuid('location_node_id').references(() => facilities.id),
    lpn: text('lpn').notNull(),
    type: text('type'),
});

export const items = pgTable('items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    mslLevel: text('msl_level'),
    documents: jsonb('documents'),
});

export const inventoryStocks = pgTable('inventory_stocks', {
    id: uuid('id').primaryKey().defaultRandom(),
    containerId: uuid('container_id').references(() => containers.id),
    itemId: uuid('item_id').references(() => items.id),
    batchCode: text('batch_code'),
    quantity: numeric('quantity', { precision: 10, scale: 4 }),
    mslLevel: text('msl_level'),
    floorLifeRemainingMinutes: integer('floor_life_rem'),
    exposureStartTime: timestamp('exposure_start_time'),
});
