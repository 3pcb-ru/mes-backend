import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { JwtUser } from '@/types/jwt.types';

import { TraceabilityService } from '../traceability/traceability.service';
import { CreateWorkOrderDto, ListWorkOrdersQueryDto } from './work-order.dto';
import { WorkOrderPolicy } from './work-order.policy';

@Injectable()
export class WorkOrderService extends BaseFilterableService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly policy: WorkOrderPolicy,
        private readonly traceability: TraceabilityService,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(WorkOrderService.name);
    }

    private get db() {
        return this.drizzle.database;
    }

    async createWorkOrder(dto: CreateWorkOrderDto, user: JwtUser) {
        if (!user.organizationId) throw new BadRequestException('User organization required to create work order');
        const organizationId = user.organizationId;
        const { bomRevisionId, targetQuantity } = dto;

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

        await this.traceability.recordChange(
            {
                entityType: 'work_order',
                entityId: workOrder.id,
                action: 'INSERT',
                newData: workOrder,
            },
            user,
        );

        return workOrder;
    }

    async releaseWorkOrder(workOrderId: string, user: JwtUser) {
        return await this.db.transaction(async (tx) => {
            const policyWhere = await this.policy.update(user, eq(Schema.workOrder.id, workOrderId), isNull(Schema.workOrder.deletedAt));

            const [wo] = await (tx.select().from(Schema.workOrder).where(policyWhere).limit(1) as any).forUpdate();

            if (!wo) throw new NotFoundException('Work Order not found');

            if (wo.status !== 'draft') {
                throw new BadRequestException('Work order is not in draft status');
            }

            const [updated] = await tx.update(Schema.workOrder).set({ status: 'released', updatedAt: new Date().toISOString() }).where(policyWhere).returning();

            await this.traceability.recordChange(
                {
                    entityType: 'work_order',
                    entityId: wo.id,
                    action: 'UPDATE',
                    oldData: wo,
                    newData: updated,
                },
                user,
                tx,
            );

            return { message: 'Work order released' };
        });
    }

    async listWorkOrders(query: ListWorkOrdersQueryDto, user: JwtUser) {
        const policyWhere = await this.policy.read(user, isNull(Schema.workOrder.deletedAt));

        return await this.filterable(this.db, Schema.workOrder, {
            defaultSortColumn: 'createdAt',
        })
            .where(policyWhere)
            .filter(query)
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .selectFields({
                ...Schema.workOrder,
            });
    }
}
