import { TestDatabaseManager } from './test-database.manager';

// Set environment variables for test database BEFORE anything else
process.env.NODE_ENV = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5433';
process.env.POSTGRES_USER = 'test_user';
process.env.POSTGRES_PASSWORD = 'test_password';
process.env.POSTGRES_DB = 'mes_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = 'test_redis_password';

// Global test setup - runs once before all tests
export default async function setupIntegrationTests() {
    console.log('🚀 Setting up integration tests...');
    console.log('📋 Environment:', { POSTGRES_HOST: process.env.POSTGRES_HOST, POSTGRES_PORT: process.env.POSTGRES_PORT, REDIS_HOST: process.env.REDIS_HOST, REDIS_PORT: process.env.REDIS_PORT });

    const dbManager = TestDatabaseManager.getInstance();

    try {
        await dbManager.startTestDatabase();

        // Store the manager instance globally so we can access it in teardown
        (global as any).testDatabaseManager = dbManager;

        console.log('✅ Integration test setup complete');
    } catch (error) {
        console.error('❌ Integration test setup failed:', error);
        process.exit(1);
    }
}

// Global test teardown - runs once after all tests
export async function teardownIntegrationTests() {
    console.log('🧹 Tearing down integration tests...');

    const dbManager = (global as any).testDatabaseManager as TestDatabaseManager;

    if (dbManager) {
        try {
            await dbManager.stopTestDatabase();
            console.log('✅ Integration test teardown complete');
        } catch (error) {
            console.error('❌ Integration test teardown failed:', error);
        }
    }
}
