import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/models/model.module';

import { BomService } from './bom.service';
import { MaterialController } from './material.controller';
import { RevisionController } from './revision.controller';

@Module({
    imports: [DrizzleModule],
    controllers: [RevisionController, MaterialController],
    providers: [BomService],
    exports: [BomService],
})
export class BomModule {}
