import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/user.decorator';
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
    async list(@CurrentUser() user: JwtUser, @Query() query: ListNodesDto) {
        return ok(await this.nodeService.list(query, user)).message('Nodes retrieved successfully');
    }

    @Post()
    @NodeDecorators.create()
    async create(@CurrentUser() user: JwtUser, @Body() payload: CreateNodeDto) {
        payload.userId = user.id;
        return ok(await this.nodeService.create(payload, user)).message('Node created successfully');
    }

    @Get(':id')
    @NodeDecorators.findOne()
    async findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.nodeService.findOne(id, user)).message('Node retrieved successfully');
    }

    @Patch(':id/status')
    @NodeDecorators.changeStatus()
    async changeStatus(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() payload: ChangeNodeStatusDto) {
        return ok(await this.nodeService.changeStatus(id, payload.status, payload.reason, user)).message('Node status changed successfully');
    }

    @Put(':id')
    @NodeDecorators.update()
    async update(@Param('id') id: string, @Body() payload: UpdateNodeDto, @CurrentUser() user: JwtUser) {
        return ok(await this.nodeService.update(id, payload, user)).message('Node updated successfully');
    }

    @Patch(':id/move')
    @NodeDecorators.move()
    async move(@Param('id') id: string, @Body() body: { parentId: string | null }, @CurrentUser() user: JwtUser) {
        return ok(await this.nodeService.move(id, body.parentId, user)).message('Node moved successfully');
    }

    @Delete(':id')
    @NodeDecorators.delete()
    async delete(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.nodeService.delete(id, user)).message('Node deleted successfully');
    }
}
