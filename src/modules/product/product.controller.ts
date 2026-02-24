import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
    constructor(private readonly svc: ProductService) {}

    @Get()
    async list() {
        const result = await this.svc.list();
        return ok(result);
    }

    @Post()
    async create(@Body() body: CreateProductDto, @CurrentUser() user: JwtUser) {
        if (!user.factoryId) {
            throw new Error('User does not belong to any factory/organization');
        }
        const result = await this.svc.create(body, user.factoryId);
        return ok(result);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const result = await this.svc.findOne(id);
        return ok(result);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: UpdateProductDto, @CurrentUser() user: JwtUser) {
        if (!user.factoryId) {
            throw new Error('User does not belong to any factory/organization');
        }
        // TODO: implement factoryId check
        // const product = await this.svc.findOne(id);
        // if (product.factoryId !== user.factoryId) {
        //     throw new Error('User does not have permission to update this product');
        // }
        const result = await this.svc.update(id, body);
        return ok(result);
    }
}
