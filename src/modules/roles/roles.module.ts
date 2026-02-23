import { Module } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { RedisModule } from '@/app/services/redis/redis.module';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';

import { UsersModule } from '../users/users.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
    imports: [RedisModule, DrizzleModule, UsersModule],
    controllers: [RolesController],
    providers: [RolesService, CustomLoggerService, FilterService],
    exports: [RolesService],
})
export class RolesModule {}
