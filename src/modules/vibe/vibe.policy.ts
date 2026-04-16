import { Injectable } from '@nestjs/common';
import { BasePolicy } from '@/common/base.policy';
import { JwtUser } from '@/types/jwt.types';
import { vibePages, type VibePage } from '@/models/schema/vibe-pages.schema';

@Injectable()
export class VibePolicy extends BasePolicy<typeof vibePages> {
    constructor() {
        super({
            table: vibePages,
            resource: 'vibe',
            owner: (t) => t.creatorId,
        });
    }

    canReadRecord(user: JwtUser, page: VibePage): boolean {
        // Private pages: creator only
        // Owner-created pages: everyone in the org
        if (page.isOwnerCreated) {
            return user.organizationId === page.organizationId;
        }
        return user.id === page.creatorId;
    }

    canWriteRecord(user: JwtUser, page: VibePage): boolean {
        // Only the creator can modify or delete
        return user.id === page.creatorId;
    }
}
