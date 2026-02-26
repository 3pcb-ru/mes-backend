import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';

@Injectable()
export class BomService {
    private db;

    constructor(private readonly drizzle: DrizzleService) {
        this.db = this.drizzle.database;
    }

    async createProduct(organizationId: string, name: string, sku: string) {
        const [newProduct] = await this.db
            .insert(Schema.product)
            .values({
                organizationId,
                name,
                sku,
            })
            .returning();
        return newProduct;
    }

    async importBom(productId: string, revisionCode: string, items: { materialName: string; quantity: number; unit: string }[]) {
        return await this.db.transaction(async (tx) => {
            const [revision] = await tx
                .insert(Schema.bomRevision)
                .values({
                    productId,
                    code: revisionCode,
                    revisionString: '1.0', // Basic versioning
                    status: 'draft',
                })
                .returning();

            const bomItems = items.map((item) => ({
                bomRevisionId: revision.id,
                materialName: item.materialName,
                quantity: item.quantity.toString(),
                unit: item.unit,
            }));

            if (bomItems.length > 0) {
                await tx.insert(Schema.bomItem).values(bomItems);
            }

            return revision;
        });
    }

    async releaseRevision(revisionId: string, organizationId: string) {
        const revision = await this.db.query.bomRevision.findFirst({
            where: eq(Schema.bomRevision.id, revisionId),
            with: {
                product: true,
            },
        });

        if (!revision || revision.product.organizationId !== organizationId) {
            throw new NotFoundException('BOM Revision not found');
        }

        if (revision.status === 'released') {
            throw new BadRequestException('Revision is already released');
        }

        await this.db.update(Schema.bomRevision).set({ status: 'released', updatedAt: new Date() }).where(eq(Schema.bomRevision.id, revisionId));

        return { message: 'Revision released' };
    }

    async getProductBom(productId: string, organizationId: string) {
        const prod = await this.db.query.product.findFirst({
            where: and(eq(Schema.product.id, productId), eq(Schema.product.organizationId, organizationId)),
            with: {
                revisions: {
                    with: {
                        items: true,
                    },
                },
            },
        });

        if (!prod) throw new NotFoundException('Product not found');
        return prod;
    }
}
