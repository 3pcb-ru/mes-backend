import { Module } from '@nestjs/common';

import { DrizzleModule } from '@/models/model.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { FilterService } from '@/common/services/filter.service';
import { StorageModule } from '@/app/services/storage/storage.module';
import { AttachmentModule } from '../attachments/attachment.module';
import { forwardRef } from '@nestjs/common';
import { MailModule } from '@/app/services/mail/mail.module';

@Module({
    imports: [DrizzleModule, StorageModule, forwardRef(() => AttachmentModule), MailModule],
    controllers: [UsersController],
    providers: [UsersService, FilterService, CustomLoggerService],
    exports: [UsersService],
})
export class UsersModule {}
