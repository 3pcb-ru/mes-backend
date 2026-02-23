import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ok } from '@/utils';

import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
    constructor(private readonly svc: ProductService) {}

    @Get()
    async list() {
        const result = await this.svc.list();
        return ok(result);
    }

    @Post()
    async create(@Body() body: CreateProductDto) {
        const result = await this.svc.create(body);
        return ok(result);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const result = await this.svc.findOne(id);
        return ok(result);
    }
}
