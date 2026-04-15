import { Module } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleModule } from '@/models/model.module';
import { TraceabilityModule } from '../traceability/traceability.module';

import { ProductController } from './product.controller';
import { ProductPolicy } from './product.policy';
import { ProductService } from './product.service';

@Module({
    imports: [DrizzleModule, TraceabilityModule],
    controllers: [ProductController],
    providers: [ProductService, ProductPolicy, FilterService, CustomLoggerService],
    exports: [ProductService, ProductPolicy],
})
export class ProductModule {}
