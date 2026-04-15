import { Module } from '@nestjs/common';

import { DrizzleModule } from '@/models/model.module';

import { BomMaterialPolicy, BomPolicy } from './bom.policy';
import { BomService } from './bom.service';
import { MaterialController } from './material.controller';
import { RevisionController } from './revision.controller';

@Module({
    imports: [DrizzleModule],
    controllers: [RevisionController, MaterialController],
    providers: [BomService, BomPolicy, BomMaterialPolicy],
    exports: [BomService, BomPolicy, BomMaterialPolicy],
})
export class BomModule {}
