import { relations } from 'drizzle-orm';

import { bomItem, bomRevision } from './bom.schema';
import { organization } from './organization.schema';
import { permissions } from './permissions.schema';
import { product } from './product.schema';
import { rolePermissions, roles } from './roles.schema';
import { user } from './users.schema';
import { workOrder } from './work-order.schema';

// Organization Relations
export const organizationRelations = relations(organization, ({ many }) => ({
    products: many(product),
    workOrders: many(workOrder),
    users: many(user),
}));

// Product Relations
export const productRelations = relations(product, ({ one, many }) => ({
    organization: one(organization, {
        fields: [product.organizationId],
        references: [organization.id],
    }),
    revisions: many(bomRevision),
}));

// BOM Relations
export const bomRevisionRelations = relations(bomRevision, ({ one, many }) => ({
    product: one(product, {
        fields: [bomRevision.productId],
        references: [product.id],
    }),
    items: many(bomItem),
    workOrders: many(workOrder),
}));

export const bomItemRelations = relations(bomItem, ({ one }) => ({
    bomRevision: one(bomRevision, {
        fields: [bomItem.bomRevisionId],
        references: [bomRevision.id],
    }),
}));

// Work Order Relations
export const workOrderRelations = relations(workOrder, ({ one }) => ({
    organization: one(organization, {
        fields: [workOrder.organizationId],
        references: [organization.id],
    }),
    bomRevision: one(bomRevision, {
        fields: [workOrder.bomRevisionId],
        references: [bomRevision.id],
    }),
}));

// Identity Relations
export const usersRelations = relations(user, ({ one }) => ({
    role: one(roles, {
        fields: [user.roleId],
        references: [roles.id],
    }),
    organization: one(organization, {
        fields: [user.organizationId],
        references: [organization.id],
    }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(user),
    rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id],
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id],
    }),
}));
