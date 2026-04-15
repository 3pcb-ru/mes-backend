import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { executionJobs } from './execution.schema';
import { nodes } from './nodes.schema';
import { organization } from './organization.schema';
import { user } from './users.schema';

export const activityLogs = pgTable('activity_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('factory_id').references(() => organization.id, { onDelete: 'cascade' }),
    timestamp: timestamp('created_at').defaultNow(),
    userId: uuid('user_id').references(() => user.id),
    jobId: uuid('job_id').references(() => executionJobs.id),
    nodeId: uuid('node_id').references(() => nodes.id),
    sourceNodeId: uuid('source_node_id').references(() => nodes.id),
    actionType: text('action_type'),
    metadata: jsonb('metadata'),
});

export const logTraceability = pgTable('log_traceability', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('factory_id').references(() => organization.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => user.id),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: text('action').notNull(),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    timestamp: timestamp('created_at').defaultNow(),
});
