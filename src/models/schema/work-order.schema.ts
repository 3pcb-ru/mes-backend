import { index, numeric, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { bomRevision } from './bom.schema';
import { organization } from './organization.schema';

export const workOrderStatusEnum = pgEnum('work_order_status_enum', ['draft', 'released', 'closed', 'canceled']);

export const workOrder = pgTable(
    'work_orders',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        organizationId: uuid('factory_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        bomRevisionId: uuid('bom_revision_id')
            .notNull()
            .references(() => bomRevision.id, { onDelete: 'restrict' }),
        targetQuantity: numeric('target_quantity', { precision: 12, scale: 4 }).notNull(),
        status: workOrderStatusEnum('status').notNull().default('draft'),
        plannedStart: timestamp('planned_start', { withTimezone: true }),
        createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('_deleted', { withTimezone: true }),
    },
    (table) => [
        index('work_order_organization_idx').on(table.organizationId),
        index('work_order_bom_revision_idx').on(table.bomRevisionId),
        index('work_order_status_idx').on(table.status),
    ],
);
