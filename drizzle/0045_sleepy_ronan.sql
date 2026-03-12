ALTER TABLE "execution_jobs" DROP CONSTRAINT "execution_jobs_name_unique";--> statement-breakpoint
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_name_unique";--> statement-breakpoint
ALTER TABLE "execution_jobs" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "work_orders" DROP COLUMN "name";