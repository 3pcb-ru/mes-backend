import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { TraceabilityDecorators } from './traceability.decorators';
import { CreateActivityDto, ListTraceabilityQueryDto } from './traceability.dto';
import { TraceabilityService } from './traceability.service';

@ApiTags('Traceability')
@ApiBearerAuth()
@Controller('trace')
export class TraceabilityController {
    constructor(private readonly svc: TraceabilityService) {}

    @Get('activities')
    @TraceabilityDecorators.list()
    async list(@Query() query: ListTraceabilityQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.svc.list(query, user);
        return ok(result.data).message('Activity logs retrieved successfully').paginate(result);
    }

    @Get('audit-logs')
    @TraceabilityDecorators.listAuditLogs()
    async listAuditLogs(@Query() query: ListTraceabilityQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.svc.listAuditLogs(query, user);
        return ok(result.data).message('Audit logs retrieved successfully').paginate(result);
    }

    @Get('activities/:id')
    @TraceabilityDecorators.getById()
    async getById(@CurrentUser() user: JwtUser, @Param('id') id: string) {
        const result = await this.svc.getById(id, user);
        return ok(result).message('Activity log retrieved successfully');
    }

    @Post('activities')
    @TraceabilityDecorators.create()
    async create(@CurrentUser() user: JwtUser, @Body() body: CreateActivityDto) {
        const result = await this.svc.create(body, user);
        return ok(result).message('Activity log created successfully');
    }
}
