import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/models/model.service';
import { bomRevision } from '@/models/schema/bom.schema';
import { product } from '@/models/schema/product.schema';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
    constructor(private readonly drizzleService: DrizzleService) {}

    async list() {
        const data = await this.drizzleService.database.query.product.findMany();
        return { data };
    }

    async create(payload: CreateProductDto, organizationId: string) {
        const [p] = await this.drizzleService.database
            .insert(product)
            .values({
                sku: payload.sku,
                name: payload.name,
                organizationId,
            })
            .returning();
        return p;
    }

    async findOne(id: string) {
        const p = await this.drizzleService.database.query.product.findFirst({
            where: eq(product.id, id),
            with: {
                revisions: true,
            },
        });
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }

    async update(id: string, payload: UpdateProductDto) {
        const [p] = await this.drizzleService.database.update(product).set(payload).where(eq(product.id, id)).returning();
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }

    async delete(id: string) {
        const activeRevision = await this.drizzleService.database.query.bomRevision.findFirst({
            where: and(eq(bomRevision.productId, id), eq(bomRevision.status, 'active')),
        });

        if (activeRevision) {
            throw new BadRequestException('Cannot delete product with active revisions');
        }

        const [p] = await this.drizzleService.database.delete(product).where(eq(product.id, id)).returning();
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }
}
