import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { DrizzleService } from '@/models/model.service';
import { bomRevision } from '@/models/schema/bom.schema';
import { product } from '@/models/schema/product.schema';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductPolicy } from './product.policy';
import { JwtUser } from '@/types/jwt.types';

@Injectable()
export class ProductService {
    private readonly policy = new ProductPolicy();

    constructor(
        private readonly drizzleService: DrizzleService,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(ProductService.name);
    }

    async list(user: JwtUser) {
        const policyWhere = await this.policy.read(user, isNull(product.deletedAt));
        const data = await this.drizzleService.database.query.product.findMany({
            where: policyWhere,
        });
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

    async findOne(id: string, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(product.id, id), isNull(product.deletedAt));
        const p = await this.drizzleService.database.query.product.findFirst({
            where: policyWhere,
            with: {
                revisions: true,
            },
        });
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }

    async update(id: string, payload: UpdateProductDto, user: JwtUser) {
        const policyWhere = await this.policy.update(user, eq(product.id, id), isNull(product.deletedAt));
        const [p] = await this.drizzleService.database
            .update(product)
            .set({ ...payload, updatedAt: new Date() })
            .where(policyWhere)
            .returning();
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }

    async delete(id: string, user: JwtUser) {
        const readWhere = await this.policy.read(user, eq(product.id, id), isNull(product.deletedAt));
        
        // Ensure user can read the product before checking active revisions
        const existingProduct = await this.drizzleService.database.query.product.findFirst({
            where: readWhere,
        });

        if (!existingProduct) throw new NotFoundException('Product not found');

        const activeRevision = await this.drizzleService.database.query.bomRevision.findFirst({
            where: and(eq(bomRevision.productId, id), eq(bomRevision.status, 'active')),
        });

        if (activeRevision) {
            throw new BadRequestException('Cannot delete product with active revisions');
        }

        const deleteWhere = await this.policy.delete(user, eq(product.id, id), isNull(product.deletedAt));
        const [p] = await this.drizzleService.database
            .update(product)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(deleteWhere)
            .returning();
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }
}
