import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ExecutionDecorators } from './execution.decorators';
import { ExecutionService } from './execution.service';

@ApiTags('Execution')
@ApiBearerAuth()
@Controller('execution')
export class ExecutionController {
    constructor(private readonly svc: ExecutionService) {}

    @Get()
    @ExecutionDecorators.list()
    async list(@CurrentUser() user: JwtUser) {
        const result = await this.svc.listWorkOrders(user);
        return ok(result).message('Work orders retrieved successfully');
    }

    @Post()
    @ExecutionDecorators.create()
    async create(@CurrentUser() user: JwtUser, @Body() body: CreateWorkOrderDto) {
        const result = await this.svc.createWorkOrder(body, user);
        return ok(result).message('Work order created successfully');
    }

    @Get(':id')
    @ExecutionDecorators.get()
    async get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
        const result = await this.svc.getWorkOrder(id, user);
        return ok(result).message('Work order retrieved successfully');
    }
}
