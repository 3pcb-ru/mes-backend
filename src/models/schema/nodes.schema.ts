import { customType, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organization } from './organization.schema';
import { user } from './users.schema';
import { Json } from '@/types';

const ltree = customType<{ data: string }>({ dataType: () => 'ltree' });

export const nodeStatusChangeReasonEnum = pgEnum('node_status_change_reason_enum', [
    'NORMAL_OPERATION',
    'MAINTENANCE',
    'SETUP_TEARDOWN',
    'MATERIAL_SHORTAGE',
    'BREAKDOWN',
    'QUALITY_ISSUE',
    'OPERATOR_BREAK',
    'OTHER',
]);

export const nodeTypeEnum = pgEnum('node_type_enum', [
    'PRODUCTION',
    'WAREHOUSE',
    'LOGISTICS',
    'FACILITY',
    'QUALITY',
    'OTHER',
]);

export const nodeDefinitions = pgTable('node_definitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('factory_id').references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: nodeTypeEnum('type').notNull().default('OTHER'),
    attributeSchema: jsonb('attribute_schema').$type<Json>(),
    supportedActions: jsonb('supported_actions').$type<Array<{ action: string; params?: unknown }>>(),
    createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
});

export const nodes = pgTable(
    'nodes',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        organizationId: uuid('factory_id').references(() => organization.id, { onDelete: 'cascade' }),
        parentId: uuid('parent_id'),
        path: ltree('path').notNull(),
        definitionId: uuid('definition_id').references(() => nodeDefinitions.id, { onDelete: 'restrict' }),
        name: text('name').notNull(),
        capabilities: jsonb('capabilities').$type<string[]>(),
        status: text('status').default('IDLE'),
        attributes: jsonb('attributes').$type<Json>(),
        userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
        createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('_deleted', { withTimezone: true }),
    },
    (t) => ({
        pathIdx: index('node_path_idx').on(t.path),
        organizationIdx: index('node_organization_idx').on(t.organizationId),
        userIdIdx: index('node_user_idx').on(t.userId),
    }),
);
