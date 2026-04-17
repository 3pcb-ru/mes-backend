import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
});

async function fix() {
    const client = await pool.connect();
    try {
        console.log('Checking items table...');
        
        // Add manufacturer if not exists
        try {
            await client.query('ALTER TABLE "items" ADD COLUMN "manufacturer" text');
            console.log('Added manufacturer column to items');
        } catch (e) {
            console.log('Manufacturer column might already exist or table missing');
        }

        // Add mpn if not exists (though 0054 drops it, let's just make it consistent with 0053 first)
        try {
            await client.query('ALTER TABLE "items" ADD COLUMN "mpn" text');
            console.log('Added mpn column to items');
        } catch (e) {
            // ignore
        }

        // Add factory_id to bom_materials if missing
        try {
            await client.query('ALTER TABLE "bom_materials" ADD COLUMN "factory_id" uuid');
            console.log('Added factory_id to bom_materials');
        } catch (e) { }

        // Add factory_id to bom_revisions if missing
        try {
            await client.query('ALTER TABLE "bom_revisions" ADD COLUMN "factory_id" uuid');
            console.log('Added factory_id to bom_revisions');
        } catch (e) { }

        console.log('Checking log_traceability table...');
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS "log_traceability" (
                    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                    "factory_id" uuid,
                    "user_id" uuid,
                    "entity_type" text NOT NULL,
                    "entity_id" uuid NOT NULL,
                    "action" text NOT NULL,
                    "old_data" jsonb,
                    "new_data" jsonb,
                    "created_at" timestamp DEFAULT now()
                )
            `);
            console.log('Ensured log_traceability table exists');
        } catch (e) {
            console.error('Failed to create log_traceability:', e.message);
        }

    } finally {
        client.release();
        await pool.end();
    }
}

fix().catch(console.error);
