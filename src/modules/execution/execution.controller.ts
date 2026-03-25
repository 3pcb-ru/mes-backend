import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ExecutionService } from './execution.service';
import { ok } from '@/utils';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExecutionDecorators } from './execution.decorators';

@ApiTags('Execution (Mock)')
@ApiBearerAuth()
@Controller('execution')
export class ExecutionController {
    constructor(private readonly svc: ExecutionService) {}

    @Get()
    @ExecutionDecorators.list()
    async list() {
        const result = await this.svc.listWorkOrders();
        return ok(result);
    }

    @Post()
    @ExecutionDecorators.create()
    async create(@Body() body: CreateWorkOrderDto) {
        const result = await this.svc.createWorkOrder(body);
        return ok(result);
    }

    @Get(':id')
    @ExecutionDecorators.get()
    async get(@Param('id') id: string) {
        const result = await this.svc.getWorkOrder(id);
        return ok(result);
    }
}
