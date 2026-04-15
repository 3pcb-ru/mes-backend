import { Module } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { WorkOrderController } from './work-order.controller';
import { WorkOrderPolicy } from './work-order.policy';
import { WorkOrderService } from './work-order.service';

@Module({
    imports: [DrizzleModule],
    controllers: [WorkOrderController],
    providers: [WorkOrderService, WorkOrderPolicy, FilterService, CustomLoggerService],
    exports: [WorkOrderService, WorkOrderPolicy],
})
export class WorkOrderModule {}
