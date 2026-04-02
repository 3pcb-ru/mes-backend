ALTER TABLE "bom_items" RENAME TO "bom_materials";--> statement-breakpoint
ALTER TABLE "bom_materials" RENAME COLUMN "material_name" TO "item_id";--> statement-breakpoint
ALTER TABLE "bom_materials" DROP CONSTRAINT "bom_items_bom_revision_id_bom_revisions_id_fk";
--> statement-breakpoint
ALTER TABLE "bom_revisions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bom_revisions" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."bom_revision_status_enum";--> statement-breakpoint
CREATE TYPE "public"."bom_revision_status_enum" AS ENUM('draft', 'submitted', 'approved', 'active');--> statement-breakpoint
ALTER TABLE "bom_revisions" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."bom_revision_status_enum";--> statement-breakpoint
ALTER TABLE "bom_revisions" ALTER COLUMN "status" SET DATA TYPE "public"."bom_revision_status_enum" USING "status"::"public"."bom_revision_status_enum";--> statement-breakpoint
DROP INDEX "bom_item_revision_idx";--> statement-breakpoint
ALTER TABLE "bom_materials" ADD COLUMN "designators" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "bom_materials" ADD COLUMN "alternatives" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD COLUMN "version" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD COLUMN "submitted_by_id" uuid;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD COLUMN "approved_by_id" uuid;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD COLUMN "submit_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD COLUMN "approve_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD COLUMN "base_revision_id" uuid;--> statement-breakpoint
ALTER TABLE "bom_materials" ADD CONSTRAINT "bom_materials_bom_revision_id_bom_revisions_id_fk" FOREIGN KEY ("bom_revision_id") REFERENCES "public"."bom_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_materials" ADD CONSTRAINT "bom_materials_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD CONSTRAINT "bom_revisions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD CONSTRAINT "bom_revisions_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_revisions" ADD CONSTRAINT "bom_revisions_base_revision_id_bom_revisions_id_fk" FOREIGN KEY ("base_revision_id") REFERENCES "public"."bom_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bom_material_revision_idx" ON "bom_materials" USING btree ("bom_revision_id");--> statement-breakpoint
ALTER TABLE "bom_revisions" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "bom_revisions" DROP COLUMN "revision_string";