import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '@/models/model.service';
import { product } from '@/models/schema/product.schema';

import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
    constructor(private readonly drizzleService: DrizzleService) {}

    async list() {
        const data = await this.drizzleService.database.query.product.findMany();
        return { data };
    }

    async create(payload: CreateProductDto, factoryId: string) {
        const [p] = await this.drizzleService.database
            .insert(product)
            .values({ ...payload, factoryId })
            .returning();
        return p;
    }

    async findOne(id: string) {
        const p = await this.drizzleService.database.query.product.findFirst({
            where: eq(product.id, id),
        });
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }
}
