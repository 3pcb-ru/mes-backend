import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { IRedisConfig, REDIS_CONFIG_TOKEN } from '@/config';

import { JOBS_QUEUES } from './jobs.constants';
import { JobsService } from './jobs.service';
import { CleanupActivityLogsProcessor } from './processors/cleanup-logs.processor';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const redisConfig = configService.getOrThrow<IRedisConfig>(REDIS_CONFIG_TOKEN);
                return {
                    connection: {
                        host: redisConfig.host,
                        port: redisConfig.port,
                        password: redisConfig.password,
                    },
                };
            },
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: JOBS_QUEUES.CORE,
        }),
    ],
    providers: [JobsService, CleanupActivityLogsProcessor],
    exports: [BullModule, JobsService],
})
export class JobsModule {}
