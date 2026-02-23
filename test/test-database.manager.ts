import { execSync } from 'child_process';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import Redis from 'ioredis';

/**
 * Test Database Manager
 * Handles Docker test database lifecycle for integration tests
 */
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private pool: Pool | null = null;

  private constructor() {}

  static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  /**
   * Start the test database container
   */
  async startTestDatabase(): Promise<void> {
    console.log('🐳 Starting test PostgreSQL and Redis containers...');
    console.log('📋 Checking Docker availability...');
    
    try {
      // Check if docker and docker-compose are available
      try {
        execSync('docker --version', { stdio: 'pipe' });
        console.log('✅ Docker is available');
      } catch {
        throw new Error('Docker is not installed or not in PATH');
      }

      try {
        execSync('docker compose version', { stdio: 'pipe' });
        console.log('✅ Docker Compose is available');
      } catch {
        throw new Error('Docker Compose is not installed or not in PATH');
      }

      console.log('🚀 Starting containers with docker compose...');
      // Start both test database and redis using docker-compose
      try {
        execSync('docker compose -f compose.test.yml down -v 2>/dev/null || true', {
          stdio: 'pipe',
          cwd: process.cwd(),
        });
        console.log('✅ Cleaned up old containers');
      } catch (e) {
        console.log('⚠️  Could not clean up old containers (this is OK)');
      }

      execSync('docker compose -f compose.test.yml up -d test_postgres test_redis', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      
      console.log('✅ Containers started, waiting for readiness...');

      // Wait for database to be ready
      await this.waitForDatabase();
      
      // Wait for redis to be ready
      await this.waitForRedis();
      
      // Run migrations on test database
      await this.runMigrations();

      // Create test users after migrations
      await this.createTestUsers();
      
      console.log('✅ Test database ready');
    } catch (error) {
      console.error('❌ Failed to start test database:', error);
      // Print docker logs for debugging
      try {
        console.log('\n📋 Docker Compose Logs:');
        execSync('docker compose -f compose.test.yml logs', { stdio: 'inherit', cwd: process.cwd() });
      } catch (e) {
        console.error('Could not retrieve logs');
      }
      throw error;
    }
  }

  /**
   * Stop and cleanup the test database container
   */
  async stopTestDatabase(): Promise<void> {
    console.log('🧹 Cleaning up test database...');
    
    try {
      if (this.pool) {
        console.log('📊 Closing database pool...');
        try {
          await this.pool.end();
        } catch (err) {
          console.warn('Warning: Error while closing pool:', (err as any).message);
        }
        this.pool = null;
        
        // Give connections time to fully close
        console.log('⏳ Waiting for connections to close...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Stop and remove the test database container
      console.log('🛑 Stopping Docker containers...');
      try {
        execSync('docker compose -f compose.test.yml down -v', {
          stdio: 'pipe',
          cwd: process.cwd(),
        });
      } catch (err) {
        console.warn('Warning: Error stopping containers:', (err as any).message);
      }

      console.log('✅ Test database cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error);
      // Don't re-throw here - it would prevent other cleanup from happening
    }
  }

  /**
   * Clean test data between tests
   */
  async cleanTestData(): Promise<void> {
    if (!this.pool) {
      this.pool = new Pool({
        host: 'localhost',
        port: 5433,
        user: 'test_user',
        password: 'test_password',
        database: 'mes_test',
        // Connection timeout settings to prevent hanging
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 10000,
        max: 10, // Limit connections
      });
    }

    const client = await this.pool.connect();
    try {
      // Clean all tables in reverse dependency order EXCEPT users (need to persist across tests)
      // Note: NOT using CASCADE to avoid accidentally deleting users due to foreign key relationships
      const tables = ['order_stage_files', 'order_stage_history', 'order_stages', 'orders', 'attachments', 'notifications'];
      
      for (const table of tables) {
        try {
          await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY`);
        } catch (error: any) {
          // Ignore table not found errors during cleanup
          console.warn(`Warning: Could not truncate table ${table}:`, error.message);
        }
      }
      
      console.log('🧽 Test data cleaned');
    } catch (error) {
      console.error('❌ Failed to clean test data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Wait for database to be ready
   */
  private async waitForDatabase(maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      let pool: Pool | null = null;
      try {
        pool = new Pool({
          host: 'localhost',
          port: 5433,
          user: 'test_user',
          password: 'test_password',
          database: 'mes_test',
          connectionTimeoutMillis: 5000,
        });

        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        
        console.log('✅ Database connection successful');
        return;
      } catch (error) {
        console.log(`⏳ Waiting for database... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        if (pool) {
          await pool.end().catch(() => {
            // Ignore errors during cleanup
          });
        }
      }
    }

    throw new Error('❌ Database failed to start within timeout');
  }

  private async waitForRedis(maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const redis = new Redis({
        host: 'localhost',
        port: 6379,
        password: 'test_redis_password',
        retryStrategy: () => null,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        connectTimeout: 5000,
      });

      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
          redis.ping((err: any) => {
            clearTimeout(timeout);
            if (err) reject(err);
            else resolve(null);
          });
        });
        
        // Close the connection properly
        redis.quit();
        console.log('✅ Redis connection successful');
        return;
      } catch (error) {
        redis.disconnect();
        console.log(`⏳ Waiting for Redis... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('❌ Redis failed to start within timeout');
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    let migrationPool: Pool | null = null;
    try {
      console.log('🔄 Running database migrations...');
      
      // Create a Drizzle database connection for migrations
      migrationPool = new Pool({
        host: 'localhost',
        port: 5433,
        user: 'test_user',
        password: 'test_password',
        database: 'mes_test',
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 10000,
        max: 10,
      });

      const db = drizzle(migrationPool);

      // Run migrations using Drizzle's migrate function
      await migrate(db, {
        migrationsFolder: './drizzle',
        migrationsTable: 'drizzle_migrations',
        migrationsSchema: 'public',
      });

      console.log('✅ Migrations completed');
    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      console.error('Error details:', error.toString());
      throw error;
    } finally {
      if (migrationPool) {
        await migrationPool.end().catch((err) => {
          console.warn('Warning: Error closing migration pool:', err.message);
        });
      }
    }
  }

  /**
   * Create test users for integration tests
   */
  private async createTestUsers(): Promise<void> {
    try {
      console.log('👥 Creating test users...');
      
      if (!this.pool) {
        this.pool = new Pool({
          host: 'localhost',
          port: 5433,
          user: 'test_user',
          password: 'test_password',
          database: 'mes_test',
          // Connection timeout settings to prevent hanging
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 10000,
          max: 10, // Limit connections
        });
      }

      const client = await this.pool.connect();
      
      try {
        // Create a test role first (or reuse if exists)
        const testRoleId = '00000000-0000-0000-0000-000000000001';
        await client.query(`
          DELETE FROM roles WHERE id = $1
        `, [testRoleId]);
        
        await client.query(`
          INSERT INTO roles (id, name, description, is_default, is_admin, _created, _updated)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [testRoleId, 'test_role', 'Test Role', false, false]);
        
        // Delete any existing test users first
        await client.query('DELETE FROM users WHERE email IN ($1, $2)', ['test@example.com', 'other@example.com']);
        
        // Create consistent test users with known UUIDs
        // These UUIDs must match the ones used in the integration tests
        const testUsers = [
          {
            id: 'edb93395-76c5-400f-a389-fd0c74ddf77e', // This is the testUserId from the test
            email: 'test@example.com',
            password: '$2b$10$placeholder.hash.for.testing',
            first_name: 'Test',
            last_name: 'User',
            is_verified: true,
            role_id: testRoleId
          },
          {
            id: 'f2a84c9b-8e7f-4d6c-9b2a-1e3f4a5b6c7d', // This will be otherUserId
            email: 'other@example.com', 
            password: '$2b$10$placeholder.hash.for.testing',
            first_name: 'Other',
            last_name: 'User',
            is_verified: true,
            role_id: testRoleId
          }
        ];

        for (const user of testUsers) {
          try {
            await client.query(`
              INSERT INTO users (id, email, password, first_name, last_name, is_verified, role_id, _created, _updated)
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [user.id, user.email, user.password, user.first_name, user.last_name, user.is_verified, user.role_id]);
          } catch (err: any) {
            // If user already exists, that's OK
            if (err.code !== '23505') {
              throw err;
            }
          }
        }

        // Verify users were actually created
        const verifyResult = await client.query('SELECT id, email FROM users ORDER BY email');
        console.log('✅ Test users created:', verifyResult.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to create test users:', error);
      throw error;
    }
  }
}
