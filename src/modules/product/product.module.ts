import { Module } from '@nestjs/common';

import { DrizzleModule } from '@/models/model.module';

import { ProductController } from './product.controller';
import { ProductPolicy } from './product.policy';
import { ProductService } from './product.service';

@Module({
    imports: [DrizzleModule],
    controllers: [ProductController],
    providers: [ProductService, ProductPolicy],
    exports: [ProductService, ProductPolicy],
})
export class ProductModule {}
