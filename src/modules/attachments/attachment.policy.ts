import { BasePolicy } from '@/common/base.policy';
import { Injectable } from '@nestjs/common';
import { inArray, type SQL } from 'drizzle-orm';

import { FILE_TYPE } from '@/common/enums';
import { attachments as attachmentSchema } from '@/models/schema/attachments.schema';
import { JwtUser } from '@/types/jwt.types';

@Injectable()
export class AttachmentsPolicy extends BasePolicy<typeof attachmentSchema> {
    constructor() {
        super({
            table: attachmentSchema,
            resource: 'attachments',
            owner: (t) => t.userId,
        });
    }

    protected override async readExtra(_user: JwtUser | undefined): Promise<SQL | null> {
        // Publicly accessible file types (avatars and logos)
        return inArray(attachmentSchema.type, [FILE_TYPE.USER_AVATAR, FILE_TYPE.ORGANIZATION_LOGO]);
    }
}
