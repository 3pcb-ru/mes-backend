import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, isNull } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { JwtUser } from '@/types/jwt.types';

import { ListExecutionQueryDto } from './execution.dto';
import { ExecutionPolicy } from './execution.policy';

@Injectable()
export class ExecutionService extends BaseFilterableService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly policy: ExecutionPolicy,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(ExecutionService.name);
    }

    private get db() {
        return this.drizzle.database;
    }

    async listExecutions(query: ListExecutionQueryDto, user: JwtUser) {
        const policyWhere = await this.policy.read(user, isNull(Schema.executionJobs.id)); // Dummy condition to allow all for now, or use real one

        return await this.filterable(this.db, Schema.executionJobs, {
            defaultSortColumn: 'id',
        })
            .where(policyWhere)
            .filter(query)
            .orderByFromQuery(query, 'id')
            .paginate(query)
            .selectFields({
                ...Schema.executionJobs,
            });
    }

    async getExecution(id: string, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(Schema.executionJobs.id, id));
        const [o] = await this.db.select().from(Schema.executionJobs).where(policyWhere).limit(1);
        if (!o) throw new NotFoundException('Execution job not found');
        return o;
    }
}
