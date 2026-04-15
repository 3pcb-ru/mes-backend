/**
 * Cron schedules for background jobs.
 * These can be used directly or overridden via environment variables.
 */
export const CronSchedule = {
    // Every day at 2:00 AM
    DAILY_2AM: '0 2 * * *',

    // Every hour at the beginning of the hour
    HOURLY: '0 * * * *',

    // Every Monday at 3:00 AM
    WEEKLY_MON_3AM: '0 3 * * 1',

    // Every minute (for testing or frequent tasks)
    EVERY_MINUTE: '* * * * *',
} as const;

export type CronScheduleType = (typeof CronSchedule)[keyof typeof CronSchedule];
