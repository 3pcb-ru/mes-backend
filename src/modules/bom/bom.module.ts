import { Module } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { TraceabilityModule } from '../traceability/traceability.module';
import { BomMaterialPolicy, BomPolicy } from './bom.policy';
import { BomService } from './bom.service';
import { MaterialController } from './material.controller';
import { RevisionController } from './revision.controller';

@Module({
    imports: [DrizzleModule, TraceabilityModule],
    controllers: [RevisionController, MaterialController],
    providers: [BomService, BomPolicy, BomMaterialPolicy, FilterService, CustomLoggerService],
    exports: [BomService, BomPolicy, BomMaterialPolicy],
})
export class BomModule {}
