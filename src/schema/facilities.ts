import { customType, index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './iam';

const ltree = customType<{ data: string }>({ dataType: () => 'ltree' });

export const nodeDefinitions = pgTable('node_definitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    name: text('name').notNull(),
    attributeSchema: jsonb('attribute_schema'),
});

export const facilities = pgTable(
    'facilities',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id').references(() => tenants.id),
        parentId: uuid('parent_id'),
        path: ltree('path').notNull(),
        definitionId: uuid('definition_id').references(() => nodeDefinitions.id),
        name: text('name').notNull(),
        capabilities: jsonb('capabilities').$type<string[]>(),
        status: text('status').default('IDLE'),
        attributes: jsonb('attributes'),
    },
    (t) => ({
        // Note: some dialect-specific index methods (e.g. USING gist) are not
        // available via the index builder's fluent API. If you need a GIST
        // index for `ltree`, create it in a migration or use raw SQL.
        pathIdx: index('path_idx').on(t.path),
    }),
);
