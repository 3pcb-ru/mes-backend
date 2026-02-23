import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { executionJobs } from './execution';
import { facilities } from './facilities';
import { tenants } from './iam';

export const activityLogs = pgTable('activity_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    timestamp: timestamp('created_at').defaultNow(),
    userId: uuid('user_id'),
    jobId: uuid('job_id').references(() => executionJobs.id),
    nodeId: uuid('node_id').references(() => facilities.id),
    sourceContainerId: uuid('source_container_id'),
    actionType: text('action_type'),
    metadata: jsonb('metadata'),
});
