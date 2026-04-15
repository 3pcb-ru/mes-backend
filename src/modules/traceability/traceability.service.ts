import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { JwtUser } from '@/types/jwt.types';

import { CreateActivityDto, ListTraceabilityQueryDto } from './traceability.dto';
import { TraceabilityPolicy } from './traceability.policy';

@Injectable()
export class TraceabilityService extends BaseFilterableService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly policy: TraceabilityPolicy,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(TraceabilityService.name);
    }

    private get db() {
        return this.drizzle.database;
    }

    async list(query: ListTraceabilityQueryDto, user: JwtUser) {
        const policyWhere = await this.policy.read(user);

        return await this.filterable(this.db, Schema.activityLogs, {
            defaultSortColumn: 'createdAt',
            defaultSortOrder: 'desc',
        })
            .where(policyWhere)
            .filter(query)
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .selectFields({
                ...Schema.activityLogs,
            });
    }

    async getById(id: string, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(Schema.activityLogs.id, id));
        const [log] = await this.db.select().from(Schema.activityLogs).where(policyWhere).limit(1);
        if (!log) throw new NotFoundException('Activity log not found');
        return log;
    }

    async create(payload: CreateActivityDto, user: JwtUser) {
        await this.policy.canWrite(user);
        const [entry] = await this.db
            .insert(Schema.activityLogs)
            .values({
                ...payload,
                organizationId: user.organizationId!,
                userId: user.id,
            })
            .returning();
        return entry;
    }
}
