import { Global, Module } from '@nestjs/common';

import { AiCoreService } from './ai-core.service';
import { VibeProvider } from './vibe.provider';

@Global()
@Module({
    providers: [AiCoreService, VibeProvider],
    exports: [AiCoreService, VibeProvider],
})
export class AiCoreModule {}
