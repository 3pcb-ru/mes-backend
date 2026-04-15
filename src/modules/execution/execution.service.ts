import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, isNull } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { DrizzleService } from '@/models/model.service';
import { workOrder } from '@/models/schema/work-order.schema';
import { JwtUser } from '@/types/jwt.types';

import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ExecutionPolicy } from './execution.policy';

@Injectable()
export class ExecutionService {
    private readonly policy = new ExecutionPolicy();

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(ExecutionService.name);
    }

    private get db() {
        return this.drizzle.database;
    }

    async listWorkOrders(user: JwtUser) {
        const policyWhere = await this.policy.read(user, isNull(workOrder.deletedAt));
        const data = await this.db.select().from(workOrder).where(policyWhere);
        return { data };
    }

    async createWorkOrder(payload: CreateWorkOrderDto, user: JwtUser) {
        await this.policy.canWrite(user);
        const [o] = await this.db
            .insert(workOrder)
            .values({
                ...payload,
                targetQuantity: payload.targetQuantity?.toString() || '0',
                organizationId: user.organizationId!,
            })
            .returning();
        return o;
    }

    async getWorkOrder(id: string, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(workOrder.id, id), isNull(workOrder.deletedAt));
        const [o] = await this.db.select().from(workOrder).where(policyWhere).limit(1);
        if (!o) throw new NotFoundException('Work order not found');
        return o;
    }
}
