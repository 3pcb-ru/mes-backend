import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { DrizzleService } from '@/models/model.service';
import { activityLogs } from '@/models/schema/traceability.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtUser } from '@/types/jwt.types';
import { TraceabilityPolicy } from './traceability.policy';

@Injectable()
export class TraceabilityService {
    private readonly policy = new TraceabilityPolicy();

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(TraceabilityService.name);
    }

    private get db() {
        return this.drizzle.database;
    }

    async list(user: JwtUser) {
        const policyWhere = await this.policy.read(user);
        const data = await this.db.select().from(activityLogs).where(policyWhere);
        return { data };
    }

    async getById(id: string, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(activityLogs.id, id));
        const [log] = await this.db
            .select()
            .from(activityLogs)
            .where(policyWhere)
            .limit(1);
        if (!log) throw new NotFoundException('Activity log not found');
        return log;
    }

    async create(payload: CreateActivityDto, user: JwtUser) {
        await this.policy.canWrite(user);
        const [entry] = await this.db
            .insert(activityLogs)
            .values({
                ...payload,
                organizationId: user.organizationId!,
            })
            .returning();
        return entry;
    }
}
