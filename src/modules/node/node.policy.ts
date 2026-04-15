import { ForbiddenException, Injectable } from '@nestjs/common';
import { eq, type SQL } from 'drizzle-orm';

import { andAll, BasePolicy, TRUE } from '@/common/base.policy';
import { nodes } from '@/models/schema/nodes.schema';
import { JwtUser } from '@/types/jwt.types';

@Injectable()
export class NodePolicy extends BasePolicy<typeof nodes> {
    constructor() {
        super({
            table: nodes,
            resource: 'nodes',
            owner: (t) => t.organizationId,
        });
    }

    protected override async readOverride(user: JwtUser, ...extra: SQL[]): Promise<SQL> {
        if (this.hasAll(user, 'read')) return andAll(TRUE, ...extra);
        if (!user.organizationId) throw new ForbiddenException('User must belong to an organization');
        return andAll(eq(this.owner(this.table), user.organizationId), ...extra);
    }

    protected override async updateOverride(user: JwtUser, ...extra: SQL[]): Promise<SQL> {
        if (this.hasAll(user, 'update')) return andAll(TRUE, ...extra);
        if (!user.organizationId) throw new ForbiddenException('User must belong to an organization');
        return andAll(eq(this.owner(this.table), user.organizationId), ...extra);
    }

    protected override async deleteOverride(user: JwtUser, ...extra: SQL[]): Promise<SQL> {
        if (this.hasAll(user, 'delete')) return andAll(TRUE, ...extra);
        if (!user.organizationId) throw new ForbiddenException('User must belong to an organization');
        return andAll(eq(this.owner(this.table), user.organizationId), ...extra);
    }
}
