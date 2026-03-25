import { Module } from '@nestjs/common';

import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { NodeController } from './node.controller';
import { NodeService } from './node.service';

import { SetupService } from './setup.service';

@Module({
    imports: [DrizzleModule],
    controllers: [NodeController],
    providers: [NodeService, SetupService, FilterService],
    exports: [NodeService, SetupService],
})
export class NodeModule {}
