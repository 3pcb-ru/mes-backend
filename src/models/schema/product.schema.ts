import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { DEFAULT_CHAR_LENGTH } from '@/common/constants';

import { organization } from './organization.schema';

export const product = pgTable(
    'products',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        organizationId: uuid('factory_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: DEFAULT_CHAR_LENGTH }).notNull(),
        sku: varchar('sku', { length: DEFAULT_CHAR_LENGTH }).notNull(),
        createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('_deleted', { withTimezone: true }),
    },
    (table) => [index('product_organization_idx').on(table.organizationId), index('product_sku_idx').on(table.sku)],
);
