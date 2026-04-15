import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
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
    async list(@CurrentUser() user: JwtUser) {
        const result = await this.svc.list(user);
        return ok(result).message('Activity logs retrieved successfully');
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
