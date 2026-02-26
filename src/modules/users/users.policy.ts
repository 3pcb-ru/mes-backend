import { Injectable } from '@nestjs/common';
import { eq, type SQL } from 'drizzle-orm';

import { andAll, BasePolicy, TRUE } from '@/common/base.policy';
import { user as userSchema } from '@/models/schema/users.schema';
import { JwtUser } from '@/types/jwt.types';

@Injectable()
export class UsersPolicy extends BasePolicy<typeof userSchema> {
    constructor() {
        super({
            table: userSchema,
            resource: 'users',
            owner: (t) => t.organizationId,
        });
    }

    /**
     * Organization-scoped read policy:
     * - `users.read.all` → see all users (admin)
     * - `users.read`     → see only users in the same organization
     */
    protected override async readOverride(user: JwtUser, ...extra: SQL[]): Promise<SQL> {
        if (this.hasAll(user, 'read')) {
            // Admin: unrestricted
            return andAll(TRUE, ...extra);
        }

        if (this.hasBase(user, 'read') && user.organizationId) {
            // Org owner/member: scope to same organization
            const orgScope = eq(this.owner(this.table), user.organizationId);
            return andAll(orgScope, ...extra);
        }

        // Fallback: can only see own record
        const selfScope = eq(userSchema.id, user.id);
        return andAll(selfScope, ...extra);
    }
}
