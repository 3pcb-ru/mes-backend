import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { WorkOrderDecorators } from './work-order.decorators';
import { CreateWorkOrderDto, ListWorkOrdersQueryDto } from './work-order.dto';
import { WorkOrderService } from './work-order.service';

@ApiTags('Work Orders')
@ApiBearerAuth()
@Controller('work-orders')
export class WorkOrderController {
    constructor(private readonly workOrderService: WorkOrderService) {}

    @Post()
    @WorkOrderDecorators.createWorkOrder()
    async createWorkOrder(@CurrentUser() user: JwtUser, @Body() body: CreateWorkOrderDto) {
        return ok(await this.workOrderService.createWorkOrder(body, user)).message('Work order created successfully');
    }

    @Post('release/:id')
    @WorkOrderDecorators.releaseWorkOrder()
    async releaseWorkOrder(@CurrentUser() user: JwtUser, @Param('id') id: string) {
        return ok(await this.workOrderService.releaseWorkOrder(id, user)).message('Work order released successfully');
    }

    @Get()
    @WorkOrderDecorators.listWorkOrders()
    async listWorkOrders(@Query() query: ListWorkOrdersQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.workOrderService.listWorkOrders(query, user);
        return ok(result.data).message('Work orders retrieved successfully').paginate(result);
    }
}
