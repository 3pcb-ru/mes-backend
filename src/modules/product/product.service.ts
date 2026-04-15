import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import { bomRevision } from '@/models/schema/bom.schema';
import { product } from '@/models/schema/product.schema';
import { JwtUser } from '@/types/jwt.types';

import { TraceabilityService } from '../traceability/traceability.service';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './product.dto';
import { ProductPolicy } from './product.policy';

@Injectable()
export class ProductService extends BaseFilterableService {
    constructor(
        private readonly drizzleService: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly policy: ProductPolicy,
        private readonly traceability: TraceabilityService,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(ProductService.name);
    }

    private get db() {
        return this.drizzleService.database;
    }

    async list(query: ListProductsQueryDto, user: JwtUser) {
        const policyWhere = await this.policy.read(user, isNull(product.deletedAt));
        return await this.filterable(this.db, product, {
            defaultSortColumn: 'createdAt',
        })
            .where(policyWhere)
            .filter(query)
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .select();
    }

    async create(payload: CreateProductDto, user: JwtUser) {
        const organizationId = user.organizationId!;
        const [p] = await this.db
            .insert(product)
            .values({
                sku: payload.sku,
                name: payload.name,
                organizationId,
            })
            .returning();

        await this.traceability.recordChange(
            {
                entityType: 'product',
                entityId: p.id,
                action: 'INSERT',
                newData: p,
            },
            user,
        );

        return p;
    }

    async findOne(id: string, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(product.id, id), isNull(product.deletedAt));
        const p = await this.db.query.product.findFirst({
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
        const existing = await this.findOne(id, user);

        const [p] = await this.db
            .update(product)
            .set({ ...payload, updatedAt: new Date() })
            .where(policyWhere)
            .returning();
        if (!p) throw new NotFoundException('Product not found');

        await this.traceability.recordChange(
            {
                entityType: 'product',
                entityId: p.id,
                action: 'UPDATE',
                oldData: existing,
                newData: p,
            },
            user,
        );

        return p;
    }

    async delete(id: string, user: JwtUser) {
        const readWhere = await this.policy.read(user, eq(product.id, id), isNull(product.deletedAt));

        // Ensure user can read the product before checking active revisions
        const existingProduct = await this.db.query.product.findFirst({
            where: readWhere,
        });

        if (!existingProduct) throw new NotFoundException('Product not found');

        const activeRevision = await this.db.query.bomRevision.findFirst({
            where: and(eq(bomRevision.productId, id), eq(bomRevision.status, 'active')),
        });

        if (activeRevision) {
            throw new BadRequestException('Cannot delete product with active revisions');
        }

        const deleteWhere = await this.policy.delete(user, eq(product.id, id), isNull(product.deletedAt));
        const [p] = await this.db.update(product).set({ deletedAt: new Date(), updatedAt: new Date() }).where(deleteWhere).returning();
        if (!p) throw new NotFoundException('Product not found');

        await this.traceability.recordChange(
            {
                entityType: 'product',
                entityId: p.id,
                action: 'DELETE',
                oldData: existingProduct,
                newData: p,
            },
            user,
        );

        return p;
    }
}
