import { Injectable } from '@nestjs/common';

import { FacilityService } from '@/modules/facility/facility.service';

import { MoveContainerDto } from '../dto/move-container.dto';
import { InventoryService } from '../inventory.service';

@Injectable()
export class TransferService {
    constructor(
        private readonly inventory: InventoryService,
        private readonly facility: FacilityService,
    ) {}

    async moveContainer(containerId: string, targetNodeIdOrDto: string | MoveContainerDto, userId?: string) {
        const dto: MoveContainerDto = typeof targetNodeIdOrDto === 'string' ? { targetNodeId: targetNodeIdOrDto, userId: userId } : targetNodeIdOrDto;
        const container = await this.inventory.getContainer(containerId);
        const targetNode = await this.facility.findOne(dto.targetNodeId).catch(() => null);

        // Simple checks
        if (!targetNode) throw new Error('Target node not found');

        // MSL related logic would live in a real MslService; stubbed here
        const isExposing = (fromNode: any, toNode: any) => {
            const fromDry = fromNode?.attributes?.storage === 'dry' || (fromNode?.capabilities || []).includes('STORAGE_DRY');
            const toOpen = (toNode?.capabilities || []).includes('SMT_PICK_PLACE');
            return fromDry && toOpen;
        };

        const fromNode = container.locationNodeId ? await this.facility.findOne(container.locationNodeId).catch(() => null) : null;
        if (isExposing(fromNode, targetNode)) {
            // In real implementation, call MslService.startExposureClock(container.contents)
            container.exposureStartedAt = new Date().toISOString();
        }

        // Capacity check (placeholder)
        if (targetNode?.attributes?.max_capacity && targetNode.current_load && targetNode.current_load >= targetNode.attributes.max_capacity) {
            throw new Error('Node is full');
        }

        // Persist
        await this.inventory.updateLocation(containerId, dto.targetNodeId);

        // Emit event via event bus in a real impl; returning simple result
        return { containerId, targetNodeId: dto.targetNodeId, movedBy: dto.userId || 'system' };
    }
}
