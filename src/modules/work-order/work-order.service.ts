import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { JwtUser } from '@/types/jwt.types';

import { WorkOrderPolicy } from './work-order.policy';

@Injectable()
export class WorkOrderService {
    private readonly policy = new WorkOrderPolicy();

    constructor(private readonly drizzle: DrizzleService) {}

    private get db() {
        return this.drizzle.database;
    }

    async createWorkOrder(bomRevisionId: string, targetQuantity: number, user: JwtUser) {
        if (!user.organizationId) throw new BadRequestException('User organization required to create work order');
        const organizationId = user.organizationId;

        await this.policy.canWrite(user);

        // Validate BOM exists and is released
        const revision = await this.db.query.bomRevision.findFirst({
            where: and(eq(Schema.bomRevision.id, bomRevisionId), isNull(Schema.bomRevision.deletedAt)),
            with: {
                product: true,
            },
        });

        if (!revision || revision.product.organizationId !== organizationId) {
            throw new NotFoundException('BOM Revision not found');
        }

        if (revision.status !== 'active') {
            throw new BadRequestException('Work order can only be created from an active BOM revision');
        }

        if (targetQuantity <= 0) {
            throw new BadRequestException('Target quantity must be greater than zero');
        }

        const [workOrder] = await this.db
            .insert(Schema.workOrder)
            .values({
                organizationId,
                bomRevisionId,
                targetQuantity: targetQuantity.toString(),
                status: 'draft',
            })
            .returning();

        return workOrder;
    }

    async releaseWorkOrder(workOrderId: string, user: JwtUser) {
        const policyWhere = await this.policy.update(user, eq(Schema.workOrder.id, workOrderId), isNull(Schema.workOrder.deletedAt));
        const wo = await this.db.query.workOrder.findFirst({
            where: policyWhere,
        });

        if (!wo) throw new NotFoundException('Work Order not found');

        if (wo.status !== 'draft') {
            throw new BadRequestException('Work order is not in draft status');
        }

        await this.db.update(Schema.workOrder).set({ status: 'released', updatedAt: new Date() }).where(policyWhere);

        return { message: 'Work order released' };
    }

    async listWorkOrders(user: JwtUser) {
        const policyWhere = await this.policy.read(user, isNull(Schema.workOrder.deletedAt));
        return await this.db.query.workOrder.findMany({
            where: policyWhere,
            with: {
                bomRevision: {
                    with: {
                        product: true,
                    },
                },
            },
        });
    }
}
