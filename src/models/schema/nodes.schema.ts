import { customType, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organization } from './organization.schema';

const ltree = customType<{ data: string }>({ dataType: () => 'ltree' });

export const nodeDefinitions = pgTable('node_definitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('factory_id').references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    attributeSchema: jsonb('attribute_schema'),
    supportedActions: jsonb('supported_actions').$type<Array<{ action: string; params?: any }>>(),
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
        attributes: jsonb('attributes'),
        createdAt: timestamp('_created', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('_updated', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        pathIdx: index('node_path_idx').on(t.path),
        organizationIdx: index('node_organization_idx').on(t.organizationId),
    }),
);
