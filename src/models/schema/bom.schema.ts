import { index, jsonb, numeric, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { items } from './inventory.schema';
import { organization } from './organization.schema';
import { product } from './product.schema';
import { user } from './users.schema';

export const bomRevisionStatusEnum = pgEnum('bom_revision_status_enum', ['draft', 'submitted', 'approved', 'active']);

export const bomRevision = pgTable(
    'bom_revisions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        organizationId: uuid('factory_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        productId: uuid('product_id')
            .notNull()
            .references(() => product.id, { onDelete: 'cascade' }),
        version: varchar('version', { length: 50 }).notNull(),
        status: bomRevisionStatusEnum('status').notNull().default('draft'),
        submittedById: uuid('submitted_by_id').references(() => user.id),
        approvedById: uuid('approved_by_id').references(() => user.id),
        submitDate: timestamp('submit_date', { withTimezone: true }),
        approveDate: timestamp('approve_date', { withTimezone: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        baseRevisionId: uuid('base_revision_id').references((): any => bomRevision.id),
        createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('_deleted', { withTimezone: true }),
    },
    (table) => [
        index('bom_revision_organization_idx').on(table.organizationId),
        index('bom_revision_product_idx').on(table.productId),
        index('bom_revision_status_idx').on(table.status),
    ],
);

export const bomMaterial = pgTable(
    'bom_materials',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        organizationId: uuid('factory_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        bomRevisionId: uuid('bom_revision_id')
            .notNull()
            .references(() => bomRevision.id, { onDelete: 'cascade' }),
        itemId: uuid('item_id')
            .notNull()
            .references(() => items.id, { onDelete: 'restrict' }),
        designators: jsonb('designators').$type<string[]>().default([]),
        alternatives: jsonb('alternatives').$type<string[]>().default([]),
        quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
        unit: varchar('unit', { length: 20 }).notNull(),
        createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('_deleted', { withTimezone: true }),
    },
    (table) => [index('bom_material_organization_idx').on(table.organizationId), index('bom_material_revision_idx').on(table.bomRevisionId)],
);
