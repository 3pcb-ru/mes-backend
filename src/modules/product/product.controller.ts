import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductDecorators } from './product.decorators';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
    constructor(private readonly svc: ProductService) {}

    @Get()
    @ProductDecorators.list()
    async list() {
        const result = await this.svc.list();
        return ok(result);
    }

    @Post()
    @ProductDecorators.create()
    async create(@Body() body: CreateProductDto, @CurrentUser() user: JwtUser) {
        if (!user.organizationId) {
            throw new Error('User does not belong to any organization');
        }
        const result = await this.svc.create(body, user.organizationId);
        return ok(result);
    }

    @Get(':id')
    @ProductDecorators.findOne()
    async get(@Param('id') id: string) {
        const result = await this.svc.findOne(id);
        return ok(result);
    }

    @Put(':id')
    @ProductDecorators.update()
    async update(@Param('id') id: string, @Body() body: UpdateProductDto) {
        const result = await this.svc.update(id, body);
        return ok(result);
    }

    @Delete(':id')
    @ProductDecorators.delete()
    async delete(@Param('id') id: string) {
        const result = await this.svc.delete(id);
        return ok(result);
    }
}
