import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, getTableColumns } from 'drizzle-orm';

import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { BaseFilterableService } from '@/common/services/base-filterable.service';
import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import * as Schema from '@/models/schema';

import { CreateNodeDto } from './dto/create-node.dto';

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

    async list(query?: PaginatedFilterQueryDto) {
        const result = await this.filterable(this.db, Schema.nodes, {
            defaultSortColumn: 'createdAt',
        })
            .filter(query || {})
            .orderByFromQuery(query || {}, 'createdAt')
            .paginate(query || {})
            .selectFields({
                ...getTableColumns(Schema.nodes),
            });

        return result;
    }

    async create(organizationId: string, payload: CreateNodeDto) {
        // Warning: Simplified ltree path logic for scoping.
        const path = payload.parentId ? `${payload.parentId}.child` : `root_${Date.now()}`;

        const [node] = await this.db
            .insert(Schema.nodes)
            .values({
                organizationId,
                name: payload.name,
                definitionId: payload.definitionId,
                status: payload.status || 'IDLE',
                attributes: payload.attributes || {},
                capabilities: payload.capabilities || [],
                parentId: payload.parentId,
                path,
            })
            .returning();

        return node;
    }

    async findOne(id: string) {
        const [node] = await this.db.select().from(Schema.nodes).where(eq(Schema.nodes.id, id)).limit(1);
        if (!node) throw new NotFoundException('Node not found');
        return node;
    }

    async update(id: string, payload: any) {
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

    async changeStatus(id: string, status: string, reason?: string) {
        return this.update(id, { status });
    }
}
