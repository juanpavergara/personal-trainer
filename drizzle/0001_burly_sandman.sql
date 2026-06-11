ALTER TYPE "public"."training_objective" ADD VALUE 'maintenance' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "routine_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"suggested_reps" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_sets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "mesocycle_id" uuid;--> statement-breakpoint
ALTER TABLE "routine_sets" ADD CONSTRAINT "routine_sets_routine_exercise_id_routine_exercises_id_fk" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "routine_sets_routine_exercise_id_idx" ON "routine_sets" USING btree ("routine_exercise_id");--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_mesocycle_id_mesocycles_id_fk" FOREIGN KEY ("mesocycle_id") REFERENCES "public"."mesocycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" DROP COLUMN "target_sets";--> statement-breakpoint
ALTER TABLE "routine_exercises" DROP COLUMN "target_reps";