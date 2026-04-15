import { Module } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { ExecutionController } from './execution.controller';
import { ExecutionPolicy } from './execution.policy';
import { ExecutionService } from './execution.service';

@Module({
    imports: [DrizzleModule],
    controllers: [ExecutionController],
    providers: [ExecutionService, ExecutionPolicy, FilterService, CustomLoggerService],
    exports: [ExecutionService, ExecutionPolicy],
})
export class ExecutionModule {}
