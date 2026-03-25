import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ok } from '@/utils';

import { CreateActivityDto } from './dto/create-activity.dto';
import { TraceabilityService } from './traceability.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TraceabilityDecorators } from './traceability.decorators';

@ApiTags('Traceability')
@ApiBearerAuth()
@Controller('trace')
export class TraceabilityController {
    constructor(private readonly svc: TraceabilityService) {}

    @Get('activities')
    @TraceabilityDecorators.list()
    async list() {
        const result = await this.svc.list();
        return ok(result);
    }

    @Get('activities/:id')
    @TraceabilityDecorators.getById()
    async getById(@Param('id') id: string) {
        const result = await this.svc.getById(id);
        return ok(result);
    }

    @Post('activities')
    @TraceabilityDecorators.create()
    async create(@Body() body: CreateActivityDto) {
        const result = await this.svc.create(body);
        return ok(result);
    }
}
