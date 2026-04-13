import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import { DrizzleService } from '../src/models/model.service';
import { eq } from 'drizzle-orm';
import * as Schema from '../src/models/schema';

async function verify() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const drizzle = app.get(DrizzleService);
    const worker = await drizzle.database.query.roles.findFirst({
        where: eq(Schema.roles.name, 'Worker'),
        with: {
            rolePermissions: {
                with: {
                    permission: true
                }
            }
        }
    });
    console.log('Worker Permissions:', JSON.stringify(worker?.rolePermissions.map(rp => rp.permission.name), null, 2));
    await app.close();
}
verify();
