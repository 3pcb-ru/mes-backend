import * as crypto from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, getTableColumns, isNull, sql } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';
import { JwtUser } from '@/types/jwt.types';

import { TraceabilityService } from '../traceability/traceability.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { ListNodesDto } from './dto/list-nodes.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { NodePolicy } from './node.policy';

@Injectable()
export class NodeService extends BaseFilterableService {
    private readonly policy = new NodePolicy();

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
        private readonly traceability: TraceabilityService,
        filterService: FilterService,
    ) {
        super(filterService);
        this.logger.setContext(NodeService.name);
    }

    private get db() {
        return this.drizzle.database;
    }

    async list(query: ListNodesDto, user: JwtUser) {
        this.logger.log(`[NodeService.list] User: ${user.id}`, query);

        const policyWhere = await this.policy.read(user, isNull(Schema.nodes.deletedAt));

        let qb = this.filterable(this.db, Schema.nodes, {
            defaultSortColumn: 'createdAt',
        })
            .join(Schema.nodeDefinitions, eq(Schema.nodes.definitionId, Schema.nodeDefinitions.id), 'left')
            .filter(query || {})
            .orderByFromQuery(query || {}, 'createdAt')
            .paginate(query || {})
            .where(policyWhere);

        if (query?.type) {
            qb = qb.where(eq(Schema.nodeDefinitions.type, query.type as (typeof Schema.nodeTypeEnum.enumValues)[number]));
        }

        const result = await qb.selectFields({
            ...getTableColumns(Schema.nodes),
        });

        return result;
    }

    async create(payload: CreateNodeDto, user: JwtUser) {
        if (!user.organizationId) throw new BadRequestException('User organization required to create node');
        const organizationId = user.organizationId;
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

        await this.traceability.recordChange(
            {
                entityType: 'node',
                entityId: node.id,
                action: 'INSERT',
                newData: node,
            },
            user,
        );

        return node;
    }

    async findOne(id: string, user?: JwtUser) {
        const _where = user ? await this.policy.read(user, eq(Schema.nodes.id, id), isNull(Schema.nodes.deletedAt)) : and(eq(Schema.nodes.id, id), isNull(Schema.nodes.deletedAt));

        const [node] = await this.db.select().from(Schema.nodes).where(_where!).limit(1);
        if (!node) throw new NotFoundException('Node not found');
        return node;
    }

    async update(id: string, payload: UpdateNodeDto, user: JwtUser) {
        const policyWhere = await this.policy.update(user, eq(Schema.nodes.id, id), isNull(Schema.nodes.deletedAt));
        const existing = await this.findOne(id, user);

        const [updated] = await this.db
            .update(Schema.nodes)
            .set({
                ...payload,
                updatedAt: new Date(),
            })
            .where(policyWhere)
            .returning();

        if (!updated) throw new NotFoundException('Node not found');

        await this.traceability.recordChange(
            {
                entityType: 'node',
                entityId: updated.id,
                action: 'UPDATE',
                oldData: existing,
                newData: updated,
            },
            user,
        );

        return updated;
    }

    async changeStatus(id: string, status: string, reason: string, user: JwtUser) {
        return await this.db.transaction(async (tx) => {
            const policyWhere = await this.policy.update(user, eq(Schema.nodes.id, id), isNull(Schema.nodes.deletedAt));
            const [node] = await ((tx.select().from(Schema.nodes).where(policyWhere).limit(1) as any).forUpdate());
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
                organizationId: user.organizationId!,
                userId: user.id,
                nodeId: id,
                actionType: 'NODE_STATUS_CHANGE',
                metadata: {
                    previousStatus,
                    newStatus: status,
                    reason,
                },
            });

            // 3. Log to log_traceability as well for consistent row-level audit
            await this.traceability.recordChange(
                {
                    entityType: 'node',
                    entityId: id,
                    action: 'UPDATE', // Status change is an update to node row
                    oldData: node,
                    newData: updated,
                },
                user,
                tx,
            );

            return updated;
        });
    }

    async move(id: string, newParentId: string | null, user: JwtUser) {
        return await this.db.transaction(async (tx) => {
            const node = await this.findOne(id, user);

            const segment = node.id.replace(/-/g, '_');
            let newPath = `root_${segment}`;
            if (newParentId) {
                const parentReadWhere = await this.policy.read(user, eq(Schema.nodes.id, newParentId), isNull(Schema.nodes.deletedAt));
                const parent = await tx.select().from(Schema.nodes).where(parentReadWhere).limit(1);
                if (!parent[0]) throw new NotFoundException('Parent node not found');
                newPath = `${parent[0].path}.${segment}`;
            }

            // Update the node itself
            const policyWhere = await this.policy.update(user, eq(Schema.nodes.id, id), isNull(Schema.nodes.deletedAt));
            const [updated] = await tx
                .update(Schema.nodes)
                .set({
                    parentId: newParentId,
                    path: newPath,
                    updatedAt: new Date(),
                })
                .where(policyWhere)
                .returning();

            await this.traceability.recordChange(
                {
                    entityType: 'node',
                    entityId: updated.id,
                    action: 'UPDATE',
                    oldData: node,
                    newData: updated,
                },
                user,
                tx,
            );

            // Update all descendants' paths using ltree functions
            await tx.execute(sql`
                UPDATE nodes 
                SET path = ${newPath} || subpath(path, nlevel(${node.path}))
                WHERE path <@ ${node.path} AND id != ${id}
            `);

            return updated;
        });
    }

    async delete(id: string, user: JwtUser) {
        return await this.db.transaction(async (tx) => {
            const node = await this.findOne(id, user);

            // 1. Check for children
            const children = await tx
                .select()
                .from(Schema.nodes)
                .where(and(eq(Schema.nodes.parentId, id), isNull(Schema.nodes.deletedAt)))
                .limit(1);
            if (children.length > 0) {
                throw new BadRequestException('Cannot delete node with active children. Move or delete children first.');
            }

            // 2. Check for active execution jobs
            const jobs = await tx.select().from(Schema.executionJobs).where(eq(Schema.executionJobs.nodeId, id)).limit(1);
            if (jobs.length > 0) {
                throw new BadRequestException('Cannot delete node referenced in execution jobs.');
            }

            // 3. Check for activity logs to decide Hard vs Soft delete
            const logs = await tx.select().from(Schema.activityLogs).where(eq(Schema.activityLogs.nodeId, id)).limit(1);

            const policyWhere = await this.policy.delete(user, eq(Schema.nodes.id, id), isNull(Schema.nodes.deletedAt));

            if (logs.length === 0 && node.status === 'IDLE') {
                // Hard Delete
                await tx.delete(Schema.nodes).where(policyWhere);

                await this.traceability.recordChange(
                    {
                        entityType: 'node',
                        entityId: node.id,
                        action: 'DELETE',
                        oldData: node,
                    },
                    user,
                    tx,
                );

                return { message: 'Node hard-deleted successfully', type: 'hard' };
            } else {
                // Soft Delete
                const [updated] = await tx
                    .update(Schema.nodes)
                    .set({
                        deletedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(policyWhere)
                    .returning();

                await this.traceability.recordChange(
                    {
                        entityType: 'node',
                        entityId: node.id,
                        action: 'DELETE',
                        oldData: node,
                        newData: updated,
                    },
                    user,
                    tx,
                );

                return { message: 'Node archived successfully', type: 'soft' };
            }
        });
    }
}
