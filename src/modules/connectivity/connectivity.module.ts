import { Module } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { DrizzleModule } from '@/models/model.module';

import { ConnectivityController } from './connectivity.controller';
import { ConnectivityService } from './connectivity.service';

@Module({
    imports: [DrizzleModule],
    controllers: [ConnectivityController],
    providers: [ConnectivityService, CustomLoggerService],
    exports: [ConnectivityService],
})
export class ConnectivityModule {}
