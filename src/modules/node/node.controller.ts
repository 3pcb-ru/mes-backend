import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { CreateNodeDto } from './dto/create-node.dto';
import { NodeService } from './node.service';

@Controller('nodes')
export class NodeController {
    constructor(private readonly nodeService: NodeService) {}

    @Get()
    async list() {
        return this.nodeService.list();
    }

    @Post()
    async create(@Body() payload: CreateNodeDto) {
        return this.nodeService.create('dummy-org-id', payload);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.nodeService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() payload: any) {
        return this.nodeService.update(id, payload);
    }
}
