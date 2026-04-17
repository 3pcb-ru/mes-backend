CREATE TYPE "public"."vibe_page_category" AS ENUM('Main', 'Operations', 'Analytics', 'Configuration', 'Custom');--> statement-breakpoint
CREATE TABLE "log_traceability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"factory_id" uuid,
	"user_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vibe_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"creator_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"category" "vibe_page_category" DEFAULT 'Custom' NOT NULL,
	"is_owner_created" boolean DEFAULT false NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bom_materials" ADD COLUMN "factory_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD COLUMN "factory_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vibe_fail_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vibe_blocked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "mpn" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "manufacturer" text;--> statement-breakpoint
ALTER TABLE "log_traceability" ADD CONSTRAINT "log_traceability_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_traceability" ADD CONSTRAINT "log_traceability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vibe_pages" ADD CONSTRAINT "vibe_pages_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vibe_pages" ADD CONSTRAINT "vibe_pages_organization_id_factories_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_materials" ADD CONSTRAINT "bom_materials_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD CONSTRAINT "bom_revisions_factory_id_factories_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bom_material_organization_idx" ON "bom_materials" USING btree ("factory_id");--> statement-breakpoint
CREATE INDEX "bom_revision_organization_idx" ON "bom_revisions" USING btree ("factory_id");