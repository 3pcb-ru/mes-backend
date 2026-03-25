import { Body, Controller, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { ChangeNodeStatusDto } from './dto/change-node-status.dto';
import { CreateNodeDto } from './dto/create-node.dto';
import { NodeService } from './node.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NodeDecorators } from './node.decorators';

@ApiTags('Nodes')
@ApiBearerAuth()
@Controller('nodes')
@UseGuards(JwtAuthGuard)
export class NodeController {
    constructor(private readonly nodeService: NodeService) {}

    @Get()
    @NodeDecorators.list()
    async list() {
        return ok(await this.nodeService.list());
    }

    @Post()
    @NodeDecorators.create()
    async create(@Request() req: { user: JwtUser }, @Body() payload: CreateNodeDto) {
        return ok(await this.nodeService.create(req.user.organizationId, payload));
    }

    @Get(':id')
    @NodeDecorators.findOne()
    async findOne(@Param('id') id: string) {
        return ok(await this.nodeService.findOne(id));
    }

    @Patch(':id/status')
    @NodeDecorators.changeStatus()
    async changeStatus(@Request() req: { user: JwtUser }, @Param('id') id: string, @Body() payload: ChangeNodeStatusDto) {
        return ok(await this.nodeService.changeStatus(id, payload.status, payload.reason, req.user.id, req.user.organizationId));
    }

    @Put(':id')
    @NodeDecorators.update()
    async update(@Param('id') id: string, @Body() payload: Record<string, any>) {
        return ok(await this.nodeService.update(id, payload));
    }
}
