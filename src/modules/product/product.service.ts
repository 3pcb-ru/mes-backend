import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';

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

        const totalRevisionsSubquery = this.db
            .select({
                productId: bomRevision.productId,
                count: sql<number>`count(*)::int`.as('count'),
            })
            .from(bomRevision)
            .groupBy(bomRevision.productId)
            .as('total_revisions');

        const activeRevisionSubquery = this.db
            .select({
                productId: bomRevision.productId,
                version: bomRevision.version,
                status: bomRevision.status,
            })
            .from(bomRevision)
            .where(eq(bomRevision.status, 'active'))
            .as('active_revision');

        return await this.filterable(this.db, product, {
            defaultSortColumn: 'createdAt',
        })
            .leftJoin(totalRevisionsSubquery, eq(product.id, totalRevisionsSubquery.productId))
            .leftJoin(activeRevisionSubquery, eq(product.id, activeRevisionSubquery.productId))
            .where(policyWhere)
            .filter(query)
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .selectFields({
                id: product.id,
                sku: product.sku,
                name: product.name,
                organizationId: product.organizationId,
                activeRevisionVersion: activeRevisionSubquery.version,
                status: activeRevisionSubquery.status,
                totalRevisions: sql<number>`COALESCE(${totalRevisionsSubquery.count}, 0)::int`,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            });
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
        return await this.db.transaction(async (tx) => {
            const readWhere = await this.policy.read(user, eq(product.id, id), isNull(product.deletedAt));

            // Fetch product with lock
            const [existingProduct] = await (tx.select().from(product).where(readWhere).limit(1) as any).forUpdate();

            if (!existingProduct) throw new NotFoundException('Product not found');

            // Check for active revisions within same transaction
            const activeRevision = await tx.query.bomRevision.findFirst({
                where: and(eq(bomRevision.productId, id), eq(bomRevision.status, 'active')),
            });

            if (activeRevision) {
                throw new BadRequestException('Cannot delete product with active revisions');
            }

            const deleteWhere = await this.policy.delete(user, eq(product.id, id), isNull(product.deletedAt));
            const [p] = await tx.update(product).set({ deletedAt: new Date(), updatedAt: new Date() }).where(deleteWhere).returning();

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
                tx,
            );

            return p;
        });
    }
}
