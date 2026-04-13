import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { ChangeNodeStatusDto } from './dto/change-node-status.dto';
import { CreateNodeDto } from './dto/create-node.dto';
import { ListNodesDto } from './dto/list-nodes.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { NodeService } from './node.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NodeDecorators } from './node.decorators';

@ApiTags('Nodes')
@ApiBearerAuth()
@Controller('nodes')
export class NodeController {
    constructor(private readonly nodeService: NodeService) {}

    @Get()
    @NodeDecorators.list()
    async list(@Request() req: { user: JwtUser }, @Query() query: ListNodesDto) {
        return ok(await this.nodeService.list(query, req.user.organizationId, req.user.id));
    }

    @Post()
    @NodeDecorators.create()
    async create(@Request() req: { user: JwtUser }, @Body() payload: CreateNodeDto) {
        payload.userId = req.user.id;
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
    async update(@Param('id') id: string, @Body() payload: UpdateNodeDto) {
        return ok(await this.nodeService.update(id, payload));
    }

    @Patch(':id/move')
    @NodeDecorators.move()
    async move(@Param('id') id: string, @Body() body: { parentId: string | null }) {
        return ok(await this.nodeService.move(id, body.parentId));
    }

    @Delete(':id')
    @NodeDecorators.delete()
    async delete(@Param('id') id: string) {
        return ok(await this.nodeService.delete(id));
    }
}
