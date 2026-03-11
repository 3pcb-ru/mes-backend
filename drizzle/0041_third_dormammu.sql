CREATE TABLE "execution_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid,
	"node_id" uuid,
	"status" text DEFAULT 'READY',
	"produced_qty" integer DEFAULT 0,
	"scrap_qty" integer DEFAULT 0,
	"_created" timestamp with time zone DEFAULT now() NOT NULL,
	"_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"factory_id" uuid,
	"name" text NOT NULL,
	"attribute_schema" jsonb,
	"supported_actions" jsonb,
	"_created" timestamp with time zone DEFAULT now() NOT NULL,
	"_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"factory_id" uuid,
	"parent_id" uuid,
	"path" "ltree" NOT NULL,
	"definition_id" uuid,
	"name" text NOT NULL,
	"capabilities" jsonb,
	"status" text DEFAULT 'IDLE',
	"attributes" jsonb,
	"_created" timestamp with time zone DEFAULT now() NOT NULL,
	"_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid,
	"item_id" uuid,
	"batch_code" text,
	"quantity" numeric(10, 4),
	"msl_level" text,
	"floor_life_rem" integer,
	"exposure_start_time" timestamp,
	"_created" timestamp with time zone DEFAULT now() NOT NULL,
	"_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"factory_id" uuid,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"msl_level" text,
	"documents" jsonb,
	"_created" timestamp with time zone DEFAULT now() NOT NULL,
	"_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"factory_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"user_id" uuid,
	"job_id" uuid,
	"node_id" uuid,
	"source_node_id" uuid,
	"action_type" text,
	"metadata" jsonb
);
--> statement-breakpoint
DROP INDEX "user_factory_idx";--> statement-breakpoint
DROP INDEX "product_factory_idx";--> statement-breakpoint
DROP INDEX "work_order_factory_idx";--> statement-breakpoint
ALTER TABLE "execution_jobs" ADD CONSTRAINT "execution_jobs_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_jobs" ADD CONSTRAINT "execution_jobs_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_definitions" ADD CONSTRAINT "node_definitions_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_definition_id_node_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."node_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_job_id_execution_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."execution_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_source_node_id_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "node_path_idx" ON "nodes" USING btree ("path");--> statement-breakpoint
CREATE INDEX "node_organization_idx" ON "nodes" USING btree ("factory_id");--> statement-breakpoint
CREATE INDEX "user_organization_idx" ON "users" USING btree ("factory_id");--> statement-breakpoint
CREATE INDEX "product_organization_idx" ON "products" USING btree ("factory_id");--> statement-breakpoint
CREATE INDEX "work_order_organization_idx" ON "work_orders" USING btree ("factory_id");