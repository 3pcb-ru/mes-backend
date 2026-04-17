import { integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { nodes } from './nodes.schema';
import { organization } from './organization.schema';

export const items = pgTable('items', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('factory_id').references(() => organization.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    manufacturer: text('manufacturer'),
    description: text('description'),
    mslLevel: text('msl_level'),
    documents: jsonb('documents'),
    createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryStocks = pgTable('inventory_stocks', {
    id: uuid('id').primaryKey().defaultRandom(),
    nodeId: uuid('node_id').references(() => nodes.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => items.id, { onDelete: 'restrict' }),
    batchCode: text('batch_code'),
    quantity: numeric('quantity', { precision: 10, scale: 4 }),
    mslLevel: text('msl_level'),
    floorLifeRemainingMinutes: integer('floor_life_rem'),
    exposureStartTime: timestamp('exposure_start_time'),
    createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
});
