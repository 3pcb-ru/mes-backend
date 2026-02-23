import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    subscriptionPlan: text('plan').default('FREE'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').default('OPERATOR'),
    isActive: boolean('is_active').default(true),
});
