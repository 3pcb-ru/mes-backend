ALTER TABLE "execution_jobs" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "execution_jobs" ADD CONSTRAINT "execution_jobs_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_name_unique" UNIQUE("name");