import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import { DrizzleService } from '../src/models/model.service';
import * as Schema from '../src/models/schema';

async function verify() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const drizzle = app.get(DrizzleService);
    const roles = await drizzle.database.query.roles.findMany();
    console.log('Roles in DB:', JSON.stringify(roles, null, 2));
    await app.close();
}
verify();
