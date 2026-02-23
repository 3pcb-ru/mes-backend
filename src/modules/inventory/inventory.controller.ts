import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { ok } from '@/utils';

import { CreateContainerDto } from './dto/create-container.dto';
import { MoveContainerDto } from './dto/move-container.dto';
import { InventoryService } from './inventory.service';
import { TransferService } from './services/transfer.service';

@Controller('inventory')
export class InventoryController {
    constructor(
        private readonly svc: InventoryService,
        private readonly transfer: TransferService,
    ) {}

    @Get('containers')
    async listContainers() {
        const result = await this.svc.listContainers();
        return ok(result);
    }

    @Post('containers')
    async createContainer(@Body() body: CreateContainerDto) {
        const result = await this.svc.createContainer(body);
        return ok(result);
    }

    @Get('containers/:id')
    async getContainer(@Param('id') id: string) {
        const result = await this.svc.getContainer(id);
        return ok(result);
    }

    @Put('containers/:id/location')
    async moveContainer(@Param('id') id: string, @Body() body: MoveContainerDto) {
        const result = await this.transfer.moveContainer(id, body.targetNodeId, body.userId || 'system');
        return ok(result);
    }
}
