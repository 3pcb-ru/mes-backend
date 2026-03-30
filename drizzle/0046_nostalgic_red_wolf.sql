CREATE TYPE "public"."node_type_enum" AS ENUM('PRODUCTION', 'WAREHOUSE', 'LOGISTICS', 'FACILITY', 'QUALITY', 'OTHER');--> statement-breakpoint
ALTER TABLE "node_definitions" ADD COLUMN "type" "node_type_enum" DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "_deleted" timestamp with time zone;