import { Module } from '@nestjs/common';

import { FacilityModule } from '@/modules/facility/facility.module';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { TransferService } from './services/transfer.service';

@Module({
    imports: [FacilityModule],
    controllers: [InventoryController],
    providers: [InventoryService, TransferService],
    exports: [InventoryService, TransferService],
})
export class InventoryModule {}
