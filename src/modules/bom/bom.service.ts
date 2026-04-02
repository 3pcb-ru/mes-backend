import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { CreateRevisionDto } from './dto/create-revision.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class BomService {
    private db;

    constructor(private readonly drizzle: DrizzleService) {
        this.db = this.drizzle.database;
    }

    // --- REVISIONS ---

    async getRevisions(productId: string) {
        return await this.db.query.bomRevision.findMany({
            where: eq(Schema.bomRevision.productId, productId),
            orderBy: [desc(Schema.bomRevision.version)],
            with: {
                materials: {
                    with: {
                        item: true,
                    },
                },
                submittedBy: true,
                approvedBy: true,
            },
        });
    }

    async createRevision(productId: string, dto: CreateRevisionDto, _userId: string) {
        const latestRevision = await this.db.query.bomRevision.findFirst({
            where: eq(Schema.bomRevision.productId, productId),
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
                version: nextVersion,
                status: 'draft',
                baseRevisionId: dto.baseRevisionId,
            })
            .returning();

        return newRevision;
    }

    async createAlternative(productId: string, baseRevisionId: string, _userId: string) {
        const baseRev = await this.db.query.bomRevision.findFirst({
            where: and(eq(Schema.bomRevision.id, baseRevisionId), eq(Schema.bomRevision.productId, productId)),
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
                    version: nextVersion,
                    status: 'draft',
                    baseRevisionId,
                })
                .returning();

            // Copy materials from base revision
            const baseMaterials = await tx.query.bomMaterial.findMany({
                where: eq(Schema.bomMaterial.bomRevisionId, baseRevisionId),
            });

            if (baseMaterials.length > 0) {
                await tx.insert(Schema.bomMaterial).values(
                    baseMaterials.map((m) => ({
                        bomRevisionId: newRevision.id,
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

    async updateRevision(productId: string, revisionId: string, version: string) {
        const _rev = await this.ensureDraft(revisionId);
        const [updated] = await this.db.update(Schema.bomRevision).set({ version, updatedAt: new Date() }).where(eq(Schema.bomRevision.id, revisionId)).returning();
        return updated;
    }

    async deleteRevision(productId: string, revisionId: string) {
        const rev = await this.db.query.bomRevision.findFirst({
            where: eq(Schema.bomRevision.id, revisionId),
        });

        if (!rev) throw new NotFoundException('Revision not found');
        if (rev.status === 'active' || rev.status === 'approved') {
            throw new BadRequestException('Cannot delete active or approved revision');
        }

        await this.db.delete(Schema.bomRevision).where(eq(Schema.bomRevision.id, revisionId));
        return { message: 'Revision deleted' };
    }

    async submitRevision(revisionId: string, userId: string) {
        const _rev = await this.ensureDraft(revisionId);
        await this.db
            .update(Schema.bomRevision)
            .set({
                status: 'submitted',
                submittedById: userId,
                submitDate: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(Schema.bomRevision.id, revisionId));
        return { message: 'Revision submitted' };
    }

    async approveRevision(revisionId: string, userId: string) {
        const rev = await this.db.query.bomRevision.findFirst({
            where: eq(Schema.bomRevision.id, revisionId),
        });

        if (!rev) throw new NotFoundException('Revision not found');
        if (rev.status !== 'submitted') {
            throw new BadRequestException('Only submitted revisions can be approved');
        }

        await this.db
            .update(Schema.bomRevision)
            .set({
                status: 'approved',
                approvedById: userId,
                approveDate: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(Schema.bomRevision.id, revisionId));
        return { message: 'Revision approved' };
    }

    async activateRevision(revisionId: string) {
        const rev = await this.db.query.bomRevision.findFirst({
            where: eq(Schema.bomRevision.id, revisionId),
        });

        if (!rev) throw new NotFoundException('Revision not found');
        if (rev.status !== 'approved') {
            throw new BadRequestException('Only approved revisions can be activated');
        }

        await this.db.update(Schema.bomRevision).set({ status: 'active', updatedAt: new Date() }).where(eq(Schema.bomRevision.id, revisionId));
        return { message: 'Revision activated' };
    }

    // --- MATERIALS ---

    async getMaterials(revisionId: string) {
        return await this.db.query.bomMaterial.findMany({
            where: eq(Schema.bomMaterial.bomRevisionId, revisionId),
            with: {
                item: true,
            },
        });
    }

    async addMaterial(revisionId: string, dto: CreateMaterialDto) {
        await this.ensureDraft(revisionId);
        const [m] = await this.db
            .insert(Schema.bomMaterial)
            .values({
                bomRevisionId: revisionId,
                ...dto,
                quantity: dto.quantity.toString(),
            })
            .returning();
        return m;
    }

    async updateMaterial(revisionId: string, materialId: string, dto: UpdateMaterialDto) {
        await this.ensureDraft(revisionId);
        const [m] = await this.db
            .update(Schema.bomMaterial)
            .set({
                ...dto,
                quantity: dto.quantity?.toString(),
                updatedAt: new Date(),
            })
            .where(and(eq(Schema.bomMaterial.id, materialId), eq(Schema.bomMaterial.bomRevisionId, revisionId)))
            .returning();

        if (!m) throw new NotFoundException('Material not found for this revision');
        return m;
    }

    async deleteMaterial(revisionId: string, materialId: string) {
        await this.ensureDraft(revisionId);
        const [m] = await this.db.delete(Schema.bomMaterial).where(and(eq(Schema.bomMaterial.id, materialId), eq(Schema.bomMaterial.bomRevisionId, revisionId))).returning();

        if (!m) throw new NotFoundException('Material not found for this revision');
        return { message: 'Material removed' };
    }

    // --- HELPERS ---

    private async ensureDraft(revisionId: string) {
        const rev = await this.db.query.bomRevision.findFirst({
            where: eq(Schema.bomRevision.id, revisionId),
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
