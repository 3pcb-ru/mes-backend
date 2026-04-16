import { Module } from '@nestjs/common';

import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';
import { AiCoreModule } from '@/modules/ai-core/ai-core.module';
import { MailModule } from '@/app/services/mail/mail.module';

import { VibeController } from './vibe.controller';
import { VibePolicy } from './vibe.policy';
import { VibeService } from './vibe.service';

@Module({
    imports: [AiCoreModule, DrizzleModule, MailModule],
    controllers: [VibeController],
    providers: [VibeService, VibePolicy, FilterService],
    exports: [VibeService],
})
export class VibeModule {}
