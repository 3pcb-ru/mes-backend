import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { WorkOrderService } from './work-order.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrderDecorators } from './work-order.decorators';

@ApiTags('Work Orders')
@ApiBearerAuth()
@Controller('work-orders')
export class WorkOrderController {
    constructor(private readonly workOrderService: WorkOrderService) {}

    @Post()
    @WorkOrderDecorators.createWorkOrder()
    async createWorkOrder(@Request() req: { user: JwtUser }, @Body() body: { bomRevisionId: string; targetQuantity: number }) {
        return ok(await this.workOrderService.createWorkOrder(req.user.organizationId, body.bomRevisionId, body.targetQuantity));
    }

    @Post('release/:id')
    @WorkOrderDecorators.releaseWorkOrder()
    async releaseWorkOrder(@Request() req: { user: JwtUser }, @Param('id') id: string) {
        return ok(await this.workOrderService.releaseWorkOrder(id, req.user.organizationId));
    }

    @Get()
    @WorkOrderDecorators.listWorkOrders()
    async listWorkOrders(@Request() req: { user: JwtUser }) {
        return ok(await this.workOrderService.listWorkOrders(req.user.organizationId));
    }
}
