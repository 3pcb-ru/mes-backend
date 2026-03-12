import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { CreateNodeDto } from './dto/create-node.dto';
import { NodeService } from './node.service';

@Controller('nodes')
@UseGuards(JwtAuthGuard)
export class NodeController {
    constructor(private readonly nodeService: NodeService) {}

    @Get()
    async list() {
        return ok(await this.nodeService.list());
    }

    @Post()
    async create(@Request() req: { user: JwtUser }, @Body() payload: CreateNodeDto) {
        return ok(await this.nodeService.create(req.user.organizationId, payload));
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return ok(await this.nodeService.findOne(id));
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() payload: Record<string, any>) {
        return ok(await this.nodeService.update(id, payload));
    }
}
