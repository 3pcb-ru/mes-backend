import { Module } from '@nestjs/common';

import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { NodeController } from './node.controller';
import { NodeService } from './node.service';

@Module({
    imports: [DrizzleModule],
    controllers: [NodeController],
    providers: [NodeService, FilterService],
    exports: [NodeService],
})
export class NodeModule {}
