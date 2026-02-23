import { Module } from '@nestjs/common';

import { DrizzleModule } from '@/models/model.module';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
    imports: [DrizzleModule],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
