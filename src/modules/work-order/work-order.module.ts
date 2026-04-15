import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/models/model.module';

import { WorkOrderController } from './work-order.controller';
import { WorkOrderPolicy } from './work-order.policy';
import { WorkOrderService } from './work-order.service';

@Module({
    imports: [DrizzleModule],
    controllers: [WorkOrderController],
    providers: [WorkOrderService, WorkOrderPolicy],
    exports: [WorkOrderService, WorkOrderPolicy],
})
export class WorkOrderModule {}
