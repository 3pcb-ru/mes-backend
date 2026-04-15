import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { lt } from 'drizzle-orm';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { ACTIVITY_LOG_RETENTION_DAYS } from '@/common/constants';
import { DrizzleService } from '@/models/model.service';
import { activityLogs } from '@/models/schema';

import { JOBS_NAMES, JOBS_QUEUES } from '../jobs.constants';

@Processor(JOBS_QUEUES.CORE)
export class CleanupActivityLogsProcessor extends WorkerHost {
    private readonly db;

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
    ) {
        super();
        this.logger.setContext(CleanupActivityLogsProcessor.name);
        this.db = this.drizzle.database;
    }

    async process(job: Job): Promise<any> {
        if (job.name === JOBS_NAMES.CLEANUP_ACTIVITY_LOGS) {
            return this.handleCleanup();
        }

        this.logger.warn(`Unknown job name: ${job.name}`);
    }

    private async handleCleanup() {
        this.logger.log('Starting cleanup of old activity logs...');

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - ACTIVITY_LOG_RETENTION_DAYS);

        try {
            // Delete logs older than the threshold date
            const result = await this.db.delete(activityLogs).where(lt(activityLogs.timestamp, thresholdDate));

            this.logger.log(`Cleanup completed. Older than: ${thresholdDate.toISOString()}. Result: ${JSON.stringify(result)}`);
            return {
                timestamp: new Date().toISOString(),
                threshold: thresholdDate.toISOString(),
                success: true,
            };
        } catch (error) {
            this.logger.error('Failed to cleanup old activity logs', error);
            throw error;
        }
    }
}
