import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { bomRevision } from './bom.schema';
import { nodes } from './nodes.schema';
import { organization } from './organization.schema';

export const workOrders = pgTable('work_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => organization.id),
    bomRevisionId: uuid('bom_revision_id').references(() => bomRevision.id),
    targetQuantity: integer('target_qty'),
    status: text('status').default('PLANNED'),
    plannedStartDate: timestamp('planned_start'),
});

export const executionJobs = pgTable('execution_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id').references(() => workOrders.id),
    nodeId: uuid('node_id').references(() => nodes.id),
    status: text('status').default('READY'),
    producedQty: integer('produced_qty').default(0),
    scrapQty: integer('scrap_qty').default(0),
});
