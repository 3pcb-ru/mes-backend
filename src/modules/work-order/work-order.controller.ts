import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { WorkOrderDecorators } from './work-order.decorators';
import { WorkOrderService } from './work-order.service';

@ApiTags('Work Orders')
@ApiBearerAuth()
@Controller('work-orders')
export class WorkOrderController {
    constructor(private readonly workOrderService: WorkOrderService) {}

    @Post()
    @WorkOrderDecorators.createWorkOrder()
    async createWorkOrder(@CurrentUser() user: JwtUser, @Body() body: { bomRevisionId: string; targetQuantity: number }) {
        return ok(await this.workOrderService.createWorkOrder(body.bomRevisionId, body.targetQuantity, user)).message('Work order created successfully');
    }

    @Post('release/:id')
    @WorkOrderDecorators.releaseWorkOrder()
    async releaseWorkOrder(@CurrentUser() user: JwtUser, @Param('id') id: string) {
        return ok(await this.workOrderService.releaseWorkOrder(id, user)).message('Work order released successfully');
    }

    @Get()
    @WorkOrderDecorators.listWorkOrders()
    async listWorkOrders(@CurrentUser() user: JwtUser) {
        return ok(await this.workOrderService.listWorkOrders(user)).message('Work orders retrieved successfully');
    }
}
