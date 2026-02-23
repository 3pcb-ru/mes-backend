import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { facilities } from './facilities';
import { tenants } from './iam';
import { bomRevisions } from './products';

export const workOrders = pgTable('work_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    bomRevisionId: uuid('bom_revision_id').references(() => bomRevisions.id),
    targetQuantity: integer('target_qty'),
    status: text('status').default('PLANNED'),
    plannedStartDate: timestamp('planned_start'),
});

export const executionJobs = pgTable('execution_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id').references(() => workOrders.id),
    nodeId: uuid('node_id').references(() => facilities.id),
    status: text('status').default('READY'),
    producedQty: integer('produced_qty').default(0),
    scrapQty: integer('scrap_qty').default(0),
});
