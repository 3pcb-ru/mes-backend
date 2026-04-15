import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/models/model.module';

import { TraceabilityController } from './traceability.controller';
import { TraceabilityPolicy } from './traceability.policy';
import { TraceabilityService } from './traceability.service';

@Module({
    imports: [DrizzleModule],
    controllers: [TraceabilityController],
    providers: [TraceabilityService, TraceabilityPolicy],
    exports: [TraceabilityService, TraceabilityPolicy],
})
export class TraceabilityModule {}
