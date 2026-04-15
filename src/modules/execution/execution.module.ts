import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/models/model.module';

import { ExecutionController } from './execution.controller';
import { ExecutionPolicy } from './execution.policy';
import { ExecutionService } from './execution.service';

@Module({
    imports: [DrizzleModule],
    controllers: [ExecutionController],
    providers: [ExecutionService, ExecutionPolicy],
    exports: [ExecutionService, ExecutionPolicy],
})
export class ExecutionModule {}
