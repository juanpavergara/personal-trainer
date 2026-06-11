ALTER TABLE "exercises" ADD COLUMN "instructions" text[];--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "source_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_source_id_idx" ON "exercises" USING btree ("source_id");