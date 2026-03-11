import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { nodes } from './nodes.schema';
import { workOrder } from './work-order.schema';

export const executionJobs = pgTable('execution_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id').references(() => workOrder.id),
    nodeId: uuid('node_id').references(() => nodes.id),
    status: text('status').default('READY'),
    producedQty: integer('produced_qty').default(0),
    scrapQty: integer('scrap_qty').default(0),
});
