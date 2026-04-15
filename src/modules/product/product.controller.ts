import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductDecorators } from './product.decorators';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
    constructor(private readonly svc: ProductService) {}

    @Get()
    @ProductDecorators.list()
    async list(@CurrentUser() user: JwtUser) {
        const result = await this.svc.list(user);
        return ok(result).message('Products retrieved successfully');
    }

    @Post()
    @ProductDecorators.create()
    async create(@Body() body: CreateProductDto, @CurrentUser() user: JwtUser) {
        if (!user.organizationId) {
            throw new ForbiddenException('User does not belong to any organization');
        }
        const result = await this.svc.create(body, user.organizationId);
        return ok(result).message('Product created successfully');
    }

    @Get(':id')
    @ProductDecorators.findOne()
    async get(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        const result = await this.svc.findOne(id, user);
        return ok(result).message('Product retrieved successfully');
    }

    @Put(':id')
    @ProductDecorators.update()
    async update(@Param('id') id: string, @Body() body: UpdateProductDto, @CurrentUser() user: JwtUser) {
        const result = await this.svc.update(id, body, user);
        return ok(result).message('Product updated successfully');
    }

    @Delete(':id')
    @ProductDecorators.delete()
    async delete(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        const result = await this.svc.delete(id, user);
        return ok(result).message('Product deleted successfully');
    }
}
