import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ExecutionService } from './execution.service';
import { ok } from '@/utils';

@Controller('work-orders')
export class ExecutionController {
    constructor(private readonly svc: ExecutionService) {}

    @Get()
    async list() {
        const result = await this.svc.listWorkOrders();
        return ok(result);
    }

    @Post()
    async create(@Body() body: CreateWorkOrderDto) {
        const result = await this.svc.createWorkOrder(body);
        return ok(result);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const result = await this.svc.getWorkOrder(id);
        return ok(result);
    }
}
