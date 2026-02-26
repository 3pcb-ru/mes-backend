import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';

@Injectable()
export class WorkOrderService {
    private db;

    constructor(private readonly drizzle: DrizzleService) {
        this.db = this.drizzle.database;
    }

    async createWorkOrder(organizationId: string, bomRevisionId: string, targetQuantity: number) {
        // Validate BOM exists and is released
        const revision = await this.db.query.bomRevision.findFirst({
            where: eq(Schema.bomRevision.id, bomRevisionId),
            with: {
                product: true,
            },
        });

        if (!revision || revision.product.organizationId !== organizationId) {
            throw new NotFoundException('BOM Revision not found');
        }

        if (revision.status !== 'released') {
            throw new BadRequestException('Work order can only be created from a released BOM revision');
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

    async releaseWorkOrder(workOrderId: string, organizationId: string) {
        const wo = await this.db.query.workOrder.findFirst({
            where: and(eq(Schema.workOrder.id, workOrderId), eq(Schema.workOrder.organizationId, organizationId)),
        });

        if (!wo) throw new NotFoundException('Work Order not found');

        if (wo.status !== 'draft') {
            throw new BadRequestException('Work order is not in draft status');
        }

        await this.db.update(Schema.workOrder).set({ status: 'released', updatedAt: new Date() }).where(eq(Schema.workOrder.id, workOrderId));

        return { message: 'Work order released' };
    }

    async listWorkOrders(organizationId: string) {
        return await this.db.query.workOrder.findMany({
            where: eq(Schema.workOrder.organizationId, organizationId),
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
