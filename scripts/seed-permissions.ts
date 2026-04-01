import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import { PermissionSeederService } from '../src/models/seeder/permission-seeder.service';

async function bootstrap() {
    console.log('🌱 Checking and initializing permission seeder context...\n');

    try {
        // Create a standalone application context (no HTTP server)
        const app = await NestFactory.createApplicationContext(AppModule, {
            logger: ['error', 'warn', 'log'],
        });

        console.log('🚀 Context initialized. Running Permission Seeder manually...\n');

        // Retrieve the Seeder service from the NestJS DI container
        const permissionSeeder = app.get(PermissionSeederService);

        // Run the seeding logic (onModuleInit contains the core seeding function)
        await permissionSeeder.onModuleInit();

        console.log('\n✅ Permission and Role seeding completed successfully!');
        
        // Gracefully close the context (disconnects DB, Redis, etc.)
        await app.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Failed to run the permission seeder script:', error);
        process.exit(1);
    }
}

bootstrap();
