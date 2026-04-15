import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { JwtUser } from '@/types/jwt.types';

import { CreateMaterialDto, CreateRevisionDto, ListBomQueryDto, UpdateMaterialDto } from './bom.dto';
import { BomMaterialPolicy, BomPolicy } from './bom.policy';

@Injectable()
export class BomService extends BaseFilterableService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly policy: BomPolicy,
        private readonly materialPolicy: BomMaterialPolicy,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(BomService.name);
    }

    private get db() {
        return this.drizzle.database;
    }

    // --- REVISIONS ---

    async getRevisions(productId: string, query: ListBomQueryDto, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(Schema.bomRevision.productId, productId), isNull(Schema.bomRevision.deletedAt));

        return await this.filterable(this.db, Schema.bomRevision, {
            defaultSortColumn: 'version',
            defaultSortOrder: 'desc',
        })
            .where(policyWhere)
            .filter(query)
            .orderByFromQuery(query, 'version')
            .paginate(query)
            .selectFields({
                ...Schema.bomRevision,
            });
    }

    async createRevision(productId: string, dto: CreateRevisionDto, user: JwtUser) {
        // Verify product access and get organizationId
        const [product] = await this.db
            .select({ organizationId: Schema.product.organizationId })
            .from(Schema.product)
            .where(and(eq(Schema.product.id, productId), isNull(Schema.product.deletedAt)))
            .limit(1);

        if (!product) throw new NotFoundException('Product not found');
        if (user.organizationId && product.organizationId !== user.organizationId && !user.permissions?.includes('products.read.all')) {
            throw new ForbiddenException('Cannot create revision for product in another organization');
        }

        const latestRevision = await this.db.query.bomRevision.findFirst({
            where: and(eq(Schema.bomRevision.productId, productId), isNull(Schema.bomRevision.deletedAt)),
            orderBy: [desc(Schema.bomRevision.version)],
        });

        let nextVersion = '1.0';
        if (latestRevision) {
            const [major] = latestRevision.version.split('.').map(Number);
            nextVersion = `${major + 1}.0`;
        }

        // If user provided a version, validate it
        if (dto.version) {
            if (latestRevision && this.compareVersions(dto.version, latestRevision.version) <= 0) {
                throw new BadRequestException(`Provided version ${dto.version} must be greater than latest ${latestRevision.version}`);
            }
            nextVersion = dto.version;
        }

        const [newRevision] = await this.db
            .insert(Schema.bomRevision)
            .values({
                productId,
                organizationId: product.organizationId,
                version: nextVersion,
                status: 'draft',
                baseRevisionId: dto.baseRevisionId,
            })
            .returning();

        return newRevision;
    }

    async createAlternative(productId: string, baseRevisionId: string, user: JwtUser) {
        const policyWhere = await this.policy.read(
            user,
            eq(Schema.bomRevision.id, baseRevisionId),
            eq(Schema.bomRevision.productId, productId),
            isNull(Schema.bomRevision.deletedAt),
        );
        const baseRev = await this.db.query.bomRevision.findFirst({
            where: policyWhere,
        });

        if (!baseRev) throw new NotFoundException('Base revision not found');

        // Find latest version with same major
        const [major] = baseRev.version.split('.').map(Number);
        const relatedRevisions = await this.db.query.bomRevision.findMany({
            where: and(eq(Schema.bomRevision.productId, productId), sql`${Schema.bomRevision.version} LIKE ${major + '.%'}`),
            orderBy: [desc(Schema.bomRevision.version)],
        });

        const latestMinor = Math.max(...relatedRevisions.map((r) => Number(r.version.split('.')[1])));
        const nextVersion = `${major}.${latestMinor + 1}`;

        return await this.db.transaction(async (tx) => {
            const [newRevision] = await tx
                .insert(Schema.bomRevision)
                .values({
                    productId,
                    organizationId: baseRev.organizationId,
                    version: nextVersion,
                    status: 'draft',
                    baseRevisionId,
                })
                .returning();

            // Copy materials from base revision
            const baseMaterials = await tx.query.bomMaterial.findMany({
                where: and(eq(Schema.bomMaterial.bomRevisionId, baseRevisionId), isNull(Schema.bomMaterial.deletedAt)),
            });

            if (baseMaterials.length > 0) {
                await tx.insert(Schema.bomMaterial).values(
                    baseMaterials.map((m) => ({
                        bomRevisionId: newRevision.id,
                        organizationId: m.organizationId,
                        itemId: m.itemId,
                        designators: m.designators,
                        alternatives: m.alternatives,
                        quantity: m.quantity,
                        unit: m.unit,
                    })),
                );
            }

            return newRevision;
        });
    }

    async updateRevision(productId: string, revisionId: string, version: string, user: JwtUser) {
        await this.ensureDraft(revisionId, user);
        const policyWhere = await this.policy.update(user, eq(Schema.bomRevision.id, revisionId), isNull(Schema.bomRevision.deletedAt));
        const [updated] = await this.db.update(Schema.bomRevision).set({ version, updatedAt: new Date() }).where(policyWhere).returning();
        return updated;
    }

    async deleteRevision(productId: string, revisionId: string, user: JwtUser) {
        const policyWhere = await this.policy.delete(user, eq(Schema.bomRevision.id, revisionId), isNull(Schema.bomRevision.deletedAt));
        const rev = await this.db.query.bomRevision.findFirst({
            where: policyWhere,
        });

        if (!rev) throw new NotFoundException('Revision not found');
        if (rev.status === 'active' || rev.status === 'approved') {
            throw new BadRequestException('Cannot delete active or approved revision');
        }

        await this.db.update(Schema.bomRevision).set({ deletedAt: new Date(), updatedAt: new Date() }).where(policyWhere);
        return { message: 'Revision deleted' };
    }

    async submitRevision(revisionId: string, user: JwtUser) {
        await this.ensureDraft(revisionId, user);
        const policyWhere = await this.policy.update(user, eq(Schema.bomRevision.id, revisionId), isNull(Schema.bomRevision.deletedAt));
        await this.db
            .update(Schema.bomRevision)
            .set({
                status: 'submitted',
                submittedById: user.id,
                submitDate: new Date(),
                updatedAt: new Date(),
            })
            .where(policyWhere);
        return { message: 'Revision submitted' };
    }

    async approveRevision(revisionId: string, user: JwtUser) {
        const policyWhere = await this.policy.update(user, eq(Schema.bomRevision.id, revisionId), isNull(Schema.bomRevision.deletedAt));
        const rev = await this.db.query.bomRevision.findFirst({
            where: policyWhere,
        });

        if (!rev) throw new NotFoundException('Revision not found');
        if (rev.status !== 'submitted') {
            throw new BadRequestException('Only submitted revisions can be approved');
        }

        await this.db
            .update(Schema.bomRevision)
            .set({
                status: 'approved',
                approvedById: user.id,
                approveDate: new Date(),
                updatedAt: new Date(),
            })
            .where(policyWhere);
        return { message: 'Revision approved' };
    }

    async activateRevision(revisionId: string, user: JwtUser) {
        const policyWhere = await this.policy.update(user, eq(Schema.bomRevision.id, revisionId), isNull(Schema.bomRevision.deletedAt));
        const rev = await this.db.query.bomRevision.findFirst({
            where: policyWhere,
        });

        if (!rev) throw new NotFoundException('Revision not found');
        if (rev.status !== 'approved') {
            throw new BadRequestException('Only approved revisions can be activated');
        }

        await this.db.update(Schema.bomRevision).set({ status: 'active', updatedAt: new Date() }).where(policyWhere);
        return { message: 'Revision activated' };
    }

    // --- MATERIALS ---

    async getMaterials(revisionId: string, query: ListBomQueryDto, user: JwtUser) {
        const policyWhere = await this.materialPolicy.read(user, eq(Schema.bomMaterial.bomRevisionId, revisionId), isNull(Schema.bomMaterial.deletedAt));

        return await this.filterable(this.db, Schema.bomMaterial, {
            defaultSortColumn: 'createdAt',
        })
            .where(policyWhere)
            .filter(query)
            .orderByFromQuery(query, 'createdAt')
            .paginate(query)
            .selectFields({
                ...Schema.bomMaterial,
            });
    }

    async addMaterial(revisionId: string, dto: CreateMaterialDto, user: JwtUser) {
        const rev = await this.ensureDraft(revisionId, user);
        await this.materialPolicy.canWrite(user);

        const [m] = await this.db
            .insert(Schema.bomMaterial)
            .values({
                bomRevisionId: revisionId,
                organizationId: rev.organizationId,
                ...dto,
                quantity: dto.quantity.toString(),
            })
            .returning();
        return m;
    }

    async updateMaterial(revisionId: string, materialId: string, dto: UpdateMaterialDto, user: JwtUser) {
        await this.ensureDraft(revisionId, user);
        const policyWhere = await this.materialPolicy.update(
            user,
            eq(Schema.bomMaterial.id, materialId),
            eq(Schema.bomMaterial.bomRevisionId, revisionId),
            isNull(Schema.bomMaterial.deletedAt),
        );
        const [m] = await this.db
            .update(Schema.bomMaterial)
            .set({
                ...dto,
                quantity: dto.quantity?.toString(),
                updatedAt: new Date(),
            })
            .where(policyWhere)
            .returning();

        if (!m) throw new NotFoundException('Material not found for this revision');
        return m;
    }

    async deleteMaterial(revisionId: string, materialId: string, user: JwtUser) {
        await this.ensureDraft(revisionId, user);
        const policyWhere = await this.materialPolicy.delete(
            user,
            eq(Schema.bomMaterial.id, materialId),
            eq(Schema.bomMaterial.bomRevisionId, revisionId),
            isNull(Schema.bomMaterial.deletedAt),
        );
        const [m] = await this.db.update(Schema.bomMaterial).set({ deletedAt: new Date(), updatedAt: new Date() }).where(policyWhere).returning();

        if (!m) throw new NotFoundException('Material not found for this revision');
        return { message: 'Material removed' };
    }

    // --- HELPERS ---

    private async ensureDraft(revisionId: string, user: JwtUser) {
        const policyWhere = await this.policy.read(user, eq(Schema.bomRevision.id, revisionId), isNull(Schema.bomRevision.deletedAt));
        const rev = await this.db.query.bomRevision.findFirst({
            where: policyWhere,
        });

        if (!rev) throw new NotFoundException('Revision not found');
        if (rev.status !== 'draft') {
            throw new BadRequestException('Changes are only allowed in draft status');
        }
        return rev;
    }

    private compareVersions(v1: string, v2: string): number {
        const p1 = v1.split('.').map(Number);
        const p2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
            const num1 = p1[i] || 0;
            const num2 = p2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }
}
