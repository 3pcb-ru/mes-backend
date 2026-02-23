import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateContainerDto } from './dto/create-container.dto';

@Injectable()
export class InventoryService {
    private containers: Array<CreateContainerDto & { id: string; exposureStartedAt?: string }> = [];

    async listContainers() {
        return { data: this.containers };
    }

    async createContainer(payload: CreateContainerDto) {
        const c = { id: `${Date.now()}`, ...payload };
        this.containers.push(c);
        return c;
    }

    async getContainer(id: string) {
        const c = this.containers.find((x) => x.id === id);
        if (!c) throw new NotFoundException('Container not found');
        return c;
    }

    async updateLocation(id: string, nodeId: string) {
        const c = await this.getContainer(id);
        c.locationNodeId = nodeId;
        return c;
    }
}
