ALTER TABLE "attachments" ADD COLUMN "url" varchar(2048);--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "url_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "node_user_idx" ON "nodes" USING btree ("user_id");