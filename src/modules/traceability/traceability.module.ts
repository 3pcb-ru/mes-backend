import { Module } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { TraceabilityController } from './traceability.controller';
import { TraceabilityPolicy } from './traceability.policy';
import { TraceabilityService } from './traceability.service';

@Module({
    imports: [DrizzleModule],
    controllers: [TraceabilityController],
    providers: [TraceabilityService, TraceabilityPolicy, FilterService, CustomLoggerService],
    exports: [TraceabilityService, TraceabilityPolicy],
})
export class TraceabilityModule {}
