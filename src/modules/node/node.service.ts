import * as crypto from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';

import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';

import { CreateNodeDto } from './dto/create-node.dto';
import { ListNodesDto } from './dto/list-nodes.dto';
import { UpdateNodeDto } from './dto/update-node.dto';

@Injectable()
export class NodeService extends BaseFilterableService {
    private db;

    constructor(
        private readonly drizzle: DrizzleService,
        filterService: FilterService,
    ) {
        super(filterService);
        this.db = this.drizzle.database;
    }

    async list(query?: ListNodesDto, organizationId?: string, userId?: string) {
        console.info(`[NodeService.list] Org: ${organizationId}, User: ${userId}`, query);
        let qb = this.filterable(this.db, Schema.nodes, {
            defaultSortColumn: 'createdAt',
        })
            .join(Schema.nodeDefinitions, eq(Schema.nodes.definitionId, Schema.nodeDefinitions.id), 'left')
            .filter(query || {})
            .orderByFromQuery(query || {}, 'createdAt')
            .paginate(query || {});

        if (query?.type) {
            qb = qb.where(eq(Schema.nodeDefinitions.type, query.type as (typeof Schema.nodeTypeEnum.enumValues)[number]));
        }

        if (organizationId || query?.organizationId) {
            qb = qb.where(eq(Schema.nodes.organizationId, (organizationId || query?.organizationId) as string));
        }

        if (userId || query?.userId) {
            qb = qb.where(eq(Schema.nodes.userId, (userId || query?.userId) as string));
        }

        const result = await qb.selectFields({
            ...getTableColumns(Schema.nodes),
        });

        return result;
    }

    async create(organizationId: string, payload: CreateNodeDto) {
        const id = crypto.randomUUID();
        const segment = id.replace(/-/g, '_');

        let path = `root_${segment}`;
        if (payload.parentId) {
            const parent = await this.findOne(payload.parentId);
            path = `${parent.path}.${segment}`;
        }

        const [node] = await this.db
            .insert(Schema.nodes)
            .values({
                id,
                organizationId,
                name: payload.name,
                definitionId: payload.definitionId,
                status: payload.status || 'IDLE',
                attributes: payload.attributes || {},
                capabilities: payload.capabilities || [],
                parentId: payload.parentId,
                path,
                userId: payload.userId,
            })
            .returning();

        return node;
    }

    async findOne(id: string) {
        const [node] = await this.db.select().from(Schema.nodes).where(eq(Schema.nodes.id, id)).limit(1);
        if (!node) throw new NotFoundException('Node not found');
        return node;
    }

    async update(id: string, payload: UpdateNodeDto) {
        const [updated] = await this.db
            .update(Schema.nodes)
            .set({
                ...payload,
                updatedAt: new Date(),
            })
            .where(eq(Schema.nodes.id, id))
            .returning();

        if (!updated) throw new NotFoundException('Node not found');
        return updated;
    }

    async changeStatus(id: string, status: string, reason: string, userId: string, organizationId: string) {
        return await this.db.transaction(async (tx) => {
            // Fetch the node first, so we know the previous status and ensure it belongs to the org
            const [node] = await tx.select().from(Schema.nodes).where(eq(Schema.nodes.id, id)).limit(1);
            if (!node) {
                throw new NotFoundException('Node not found');
            }

            const previousStatus = node.status;

            // 1. Update the node status
            const [updated] = await tx
                .update(Schema.nodes)
                .set({
                    status,
                    updatedAt: new Date(),
                })
                .where(eq(Schema.nodes.id, id))
                .returning();

            // 2. Log the change to activity_logs
            await tx.insert(Schema.activityLogs).values({
                organizationId,
                userId,
                nodeId: id,
                actionType: 'NODE_STATUS_CHANGE',
                metadata: {
                    previousStatus,
                    newStatus: status,
                    reason,
                },
            });

            return updated;
        });
    }

    async move(id: string, newParentId: string | null) {
        return await this.db.transaction(async (tx) => {
            const node = await this.findOne(id);

            const segment = node.id.replace(/-/g, '_');
            let newPath = `root_${segment}`;
            if (newParentId) {
                const parent = await tx.select().from(Schema.nodes).where(eq(Schema.nodes.id, newParentId)).limit(1);
                if (!parent[0]) throw new NotFoundException('Parent node not found');
                newPath = `${parent[0].path}.${segment}`;
            }

            // Update the node itself
            const [updated] = await tx
                .update(Schema.nodes)
                .set({
                    parentId: newParentId,
                    path: newPath,
                    updatedAt: new Date(),
                })
                .where(eq(Schema.nodes.id, id))
                .returning();

            // Update all descendants' paths using ltree functions
            await tx.execute(sql`
                UPDATE nodes 
                SET path = ${newPath} || subpath(path, nlevel(${node.path}))
                WHERE path <@ ${node.path} AND id != ${id}
            `);

            return updated;
        });
    }

    async delete(id: string) {
        return await this.db.transaction(async (tx) => {
            const node = await this.findOne(id);

            // 1. Check for children
            const children = await tx.select().from(Schema.nodes).where(and(eq(Schema.nodes.parentId, id), isNull(Schema.nodes.deletedAt))).limit(1);
            if (children.length > 0) {
                throw new Error('Cannot delete node with active children. Move or delete children first.');
            }

            // 2. Check for active execution jobs
            const jobs = await tx.select().from(Schema.executionJobs).where(eq(Schema.executionJobs.nodeId, id)).limit(1);
            if (jobs.length > 0) {
                throw new Error('Cannot delete node referenced in execution jobs.');
            }

            // 3. Check for activity logs to decide Hard vs Soft delete
            const logs = await tx.select().from(Schema.activityLogs).where(eq(Schema.activityLogs.nodeId, id)).limit(1);

            if (logs.length === 0 && node.status === 'IDLE') {
                // Hard Delete
                await tx.delete(Schema.nodes).where(eq(Schema.nodes.id, id));
                return { message: 'Node hard-deleted successfully', type: 'hard' };
            } else {
                // Soft Delete
                await tx
                    .update(Schema.nodes)
                    .set({
                        deletedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(Schema.nodes.id, id));
                return { message: 'Node archived successfully', type: 'soft' };
            }
        });
    }
}
