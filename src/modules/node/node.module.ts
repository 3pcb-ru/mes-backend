import { Module } from '@nestjs/common';

import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { TraceabilityModule } from '../traceability/traceability.module';
import { NodeController } from './node.controller';
import { NodePolicy } from './node.policy';
import { NodeService } from './node.service';
import { SetupService } from './setup.service';

@Module({
    imports: [DrizzleModule, TraceabilityModule],
    controllers: [NodeController],
    providers: [NodeService, SetupService, FilterService, NodePolicy],
    exports: [NodeService, SetupService, NodePolicy],
})
export class NodeModule {}
