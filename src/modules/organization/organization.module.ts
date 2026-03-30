import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { AttachmentModule } from '../attachments/attachment.module';

import { NodeModule } from '../node/node.module';

@Module({
    imports: [AttachmentModule, NodeModule],
    controllers: [OrganizationController],
    providers: [OrganizationService],
    exports: [OrganizationService],
})
export class OrganizationModule {}
