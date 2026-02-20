import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { NOTIFICATION_STATUS, NOTIFICATION_TYPE, NOTIFICATION_WAY } from '../src/common/enums';
import * as Schema from '../src/models/schema';

// Load environment variables from .env file
config();

// Validate required environment variables
const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please ensure your .env file contains all required database configuration.');
    process.exit(1);
}

// Database connection using environment variables
const pool = new Pool({
    host: process.env.POSTGRES_HOST!,
    port: parseInt(process.env.POSTGRES_PORT!),
    database: process.env.POSTGRES_DB!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
});

const db = drizzle(pool);

// Sample notification templates
const notificationTemplates = [
    {
        type: NOTIFICATION_TYPE.WORK_ORDER_STATUS,
        subject: 'Work Order #WO-2024-001 Status Update',
        description: 'Your work order has been moved to the manufacturing stage.',
        data: { workOrderId: 'WO-2024-001', stage: 'manufacturing', previousStage: 'engineering' },
    },
    {
        type: NOTIFICATION_TYPE.WORK_ORDER_STATUS,
        subject: 'Work Order #WO-2024-002 Completed',
        description: 'Your PCB work order has been completed and is ready for quality control.',
        data: { workOrderId: 'WO-2024-002', stage: 'quality_control', completed: true },
    },
    {
        type: NOTIFICATION_TYPE.SHIPPING_UPDATE,
        subject: 'Shipment Dispatched - Tracking #TRK123456',
        description: 'Your order has been shipped and is on the way. Expected delivery: Feb 20, 2026.',
        data: { trackingNumber: 'TRK123456', carrier: 'DHL', estimatedDelivery: '2026-02-20' },
    },
    {
        type: NOTIFICATION_TYPE.SHIPPING_UPDATE,
        subject: 'Delivery Confirmation - Order #ORD-2024-015',
        description: 'Your order has been successfully delivered to the specified address.',
        data: { orderId: 'ORD-2024-015', deliveredAt: '2026-02-13T10:30:00Z', signature: 'John Doe' },
    },
    {
        type: NOTIFICATION_TYPE.SYSTEM,
        subject: 'System Maintenance Scheduled',
        description: 'Scheduled maintenance on Feb 15, 2026 from 2:00 AM to 4:00 AM (UTC). Services will be temporarily unavailable.',
        data: { maintenanceWindow: { start: '2026-02-15T02:00:00Z', end: '2026-02-15T04:00:00Z' } },
    },
    {
        type: NOTIFICATION_TYPE.SYSTEM,
        subject: 'Security Alert: New Login Detected',
        description: "A new login was detected from Istanbul, Turkey. If this wasn't you, please secure your account immediately.",
        data: { location: 'Istanbul, Turkey', ipAddress: '185.125.190.58', device: 'Chrome on macOS' },
    },
    {
        type: NOTIFICATION_TYPE.PRODUCT,
        subject: 'New Product Available: Advanced PCB Series',
        description: 'Check out our new Advanced PCB series with improved thermal management and higher layer count support.',
        data: { productLine: 'Advanced PCB', features: ['thermal management', 'high layer count', 'HDI support'] },
    },
    {
        type: NOTIFICATION_TYPE.PRODUCT,
        subject: 'Price Update: PCBA Assembly Services',
        description: 'Special pricing now available for PCBA assembly services. Save up to 20% on bulk orders.',
        data: { discount: 20, minQuantity: 100, validUntil: '2026-03-31' },
    },
    {
        type: NOTIFICATION_TYPE.WORK_ORDER_STATUS,
        subject: 'Quality Check Issue - Work Order #WO-2024-003',
        description: 'A minor issue was found during quality inspection. Our team is working on resolution.',
        data: { workOrderId: 'WO-2024-003', issue: 'solder joint quality', severity: 'minor', eta: '2026-02-14' },
    },
    {
        type: NOTIFICATION_TYPE.SHIPPING_UPDATE,
        subject: 'Customs Clearance in Progress',
        description: 'Your international shipment is currently undergoing customs clearance. This may take 1-2 business days.',
        data: { trackingNumber: 'INT789012', customsLocation: 'Istanbul Airport', status: 'in_clearance' },
    },
];

async function seedNotifications() {
    try {
        console.log('🌱 Starting to seed dummy notifications...\n');

        // Fetch a user from the database (you can modify this query to target specific users)
        const users = await db.select({ id: Schema.user.id, email: Schema.user.email }).from(Schema.user).limit(5);

        if (users.length === 0) {
            console.error('❌ No users found in the database. Please create users first.');
            process.exit(1);
        }

        console.log(`✅ Found ${users.length} user(s) in the database:\n`);
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
        });
        console.log('');

        // Generate notifications for each user
        const notifications: any[] = [];
        const ways = [NOTIFICATION_WAY.IN_APP, NOTIFICATION_WAY.EMAIL, NOTIFICATION_WAY.PUSH];
        const statuses = [NOTIFICATION_STATUS.SENT, NOTIFICATION_STATUS.DELIVERED, NOTIFICATION_STATUS.READ];

        users.forEach((user) => {
            // Create 2-3 notifications per template for variety
            notificationTemplates.forEach((template, templateIndex) => {
                const shouldCreate = templateIndex % 2 === 0 || users.indexOf(user) === 0; // Create some for all users, more for first user

                if (shouldCreate) {
                    const status = statuses[Math.floor(Math.random() * statuses.length)];
                    const createdHoursAgo = Math.floor(Math.random() * 72); // Random time in last 3 days
                    const createdAt = new Date(Date.now() - createdHoursAgo * 60 * 60 * 1000);

                    notifications.push({
                        userId: user.id,
                        type: template.type,
                        way: ways[Math.floor(Math.random() * ways.length)],
                        status: status,
                        subject: template.subject,
                        description: template.description,
                        data: template.data,
                        readAt: status === NOTIFICATION_STATUS.READ ? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
                        createdAt: createdAt,
                        updatedAt: createdAt,
                    });
                }
            });
        });

        // Insert notifications in batches
        console.log(`📝 Inserting ${notifications.length} dummy notifications...\n`);

        const inserted = await db.insert(Schema.notifications).values(notifications).returning();

        console.log(`✅ Successfully created ${inserted.length} dummy notifications!\n`);

        // Show summary by user
        console.log('📊 Summary by user:');
        users.forEach((user) => {
            const userNotifications = inserted.filter((n) => n.userId === user.id);
            const unreadCount = userNotifications.filter((n) => n.status !== NOTIFICATION_STATUS.READ).length;
            console.log(`   ${user.email}: ${userNotifications.length} total (${unreadCount} unread)`);
        });

        console.log('\n✨ Done! You can now view these notifications in your app.');
    } catch (error) {
        console.error('❌ Error seeding notifications:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the seed function
seedNotifications();
