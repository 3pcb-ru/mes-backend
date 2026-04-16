import { type InferSelectModel } from 'drizzle-orm';
import { boolean, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { organization } from './organization.schema';
import { user } from './users.schema';

export const vibePageCategoryEnum = pgEnum('vibe_page_category', ['Main', 'Operations', 'Analytics', 'Configuration', 'Custom']);

export const vibePages = pgTable('vibe_pages', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    creatorId: uuid('creator_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organization.id, { onDelete: 'cascade' }),
    category: vibePageCategoryEnum('category').default('Custom').notNull(),
    isOwnerCreated: boolean('is_owner_created').default(false).notNull(),
    config: jsonb('config').notNull(), // Layout schema: Sections -> Grid -> Component
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type VibePage = InferSelectModel<typeof vibePages>;
