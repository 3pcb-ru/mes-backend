import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

import { CustomLoggerService } from '@/app/services/logger/logger.service';

import { JOBS_NAMES, JOBS_QUEUES } from './jobs.constants';
import { CronSchedule } from './jobs.cron';

@Injectable()
export class JobsService implements OnModuleInit {
    constructor(
        @InjectQueue(JOBS_QUEUES.CORE) private readonly coreQueue: Queue,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(JobsService.name);
    }

    async onModuleInit() {
        this.logger.log('Initializing background jobs...');
        await this.setupRepeatableJobs();
    }

    /**
     * Setup jobs that should run on a schedule (repeatable jobs).
     */
    private async setupRepeatableJobs() {
        try {
            // Cleanup Activity Logs Job - Every day at 2:00 AM
            await this.coreQueue.add(
                JOBS_NAMES.CLEANUP_ACTIVITY_LOGS,
                {},
                {
                    repeat: { pattern: CronSchedule.DAILY_2AM },
                    jobId: JOBS_NAMES.CLEANUP_ACTIVITY_LOGS, // Ensure unique job ID to avoid duplicates
                    removeOnComplete: true,
                    removeOnFail: 1000,
                },
            );
            this.logger.log(`Scheduled repeatable job: ${JOBS_NAMES.CLEANUP_ACTIVITY_LOGS}`);
        } catch (error) {
            this.logger.error('Failed to setup repeatable jobs', error);
        }
    }

    /**
     * Generic method to add a job to the core queue.
     * @param name Job name
     * @param data Job data
     * @param opts Job options
     */
    async addJob(name: string, data: any = {}, opts: any = {}) {
        this.logger.log(`Adding job: ${name}`);
        return this.coreQueue.add(name, data, opts);
    }
}
