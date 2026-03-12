ALTER TABLE "execution_jobs" DROP CONSTRAINT "execution_jobs_work_order_id_work_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "execution_jobs" DROP CONSTRAINT "execution_jobs_node_id_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "execution_jobs" ADD CONSTRAINT "execution_jobs_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_jobs" ADD CONSTRAINT "execution_jobs_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_jobs" DROP COLUMN "_created";--> statement-breakpoint
ALTER TABLE "execution_jobs" DROP COLUMN "_updated";