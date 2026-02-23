import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ok } from '@/utils';

import { CreateActivityDto } from './dto/create-activity.dto';
import { TraceabilityService } from './traceability.service';

@Controller('trace')
export class TraceabilityController {
    constructor(private readonly svc: TraceabilityService) {}

    @Get('activities')
    async list() {
        const result = await this.svc.list();
        return ok(result);
    }

    @Get('activities/:id')
    async getById(@Param('id') id: string) {
        const result = await this.svc.getById(id);
        return ok(result);
    }

    @Post('activities')
    async create(@Body() body: CreateActivityDto) {
        const result = await this.svc.create(body);
        return ok(result);
    }
}
