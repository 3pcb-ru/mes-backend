import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { asc, eq, isNull } from 'drizzle-orm';

import { databaseConfig, redisConfig, serverConfig } from '@/config';
import { DrizzleModule } from '@/models/model.module';
import * as Schema from '@/models/schema';
import { LoggerModule } from '@/app/services/logger/logger.module';
import { RedisModule } from '@/app/services/redis/redis.module';
import { UsersModule } from '@/modules/users/users.module';
import { RolesModule } from '@/modules/roles/roles.module';
import { DrizzleService } from '@/models/model.service';
import { RolesService } from '@/modules/roles/roles.service';

// We define a minimal module to avoid running the full AppModule initialization (like the seeder)
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig, redisConfig, serverConfig],
        }),
        EventEmitterModule.forRoot(),
        ScheduleModule.forRoot(),
        LoggerModule,
        DrizzleModule,
        RedisModule,
        UsersModule,
        RolesModule,
    ],
})
class MigrationModule {}

async function bootstrap() {
    console.log('🌱 Promoting organization owners to Admin role...\n');

    try {
        // Create a standalone application context with our minimal module
        const app = await NestFactory.createApplicationContext(MigrationModule, {
            logger: ['error', 'warn', 'log'],
        });

        const drizzle = app.get(DrizzleService);
        const rolesService = app.get(RolesService);
        const db = drizzle.database;

        // 1. Get the admin role
        const adminRole = await rolesService.getAdmin();
        console.log(`✅ System Admin role found: ${adminRole.id} (${adminRole.name})`);

        // 2. Get all active organizations
        const orgs = await db.select().from(Schema.organization).where(isNull(Schema.organization.deletedAt));
        console.log(`📂 Found ${orgs.length} active organizations.\n`);

        let promotedCount = 0;
        let skippedCount = 0;

        for (const org of orgs) {
            // 3. Find the earliest user for this organization (Org Owner)
            const [earliestUser] = await db
                .select()
                .from(Schema.user)
                .where(eq(Schema.user.organizationId, org.id))
                .orderBy(asc(Schema.user.createdAt))
                .limit(1);

            if (earliestUser) {
                if (earliestUser.roleId !== adminRole.id) {
                    console.log(`👤 Promoting user: ${earliestUser.email}`);
                    console.log(`   Organization: ${org.name}`);
                    
                    try {
                        await rolesService.assignToUser(earliestUser.id, adminRole.id);
                        console.log(`   ✨ Successfully promoted to Admin.\n`);
                        promotedCount++;
                    } catch (err: any) {
                        console.error(`   ❌ Failed to promote user ${earliestUser.email}:`, err.message);
                    }
                } else {
                    console.log(`ℹ️  User ${earliestUser.email} for Org ${org.name} is already an Admin. Skipping.\n`);
                    skippedCount++;
                }
            } else {
                console.log(`⚠️  No users found for organization: ${org.name}\n`);
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Promotion script completed.`);
        console.log(`📊 Summary: ${promotedCount} promoted, ${skippedCount} already Admin.`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        await app.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Failed to run the promotion script:', error);
        process.exit(1);
    }
}

bootstrap();
