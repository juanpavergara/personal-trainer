CREATE TYPE "public"."media_type" AS ENUM('video', 'gif', 'animation');--> statement-breakpoint
CREATE TYPE "public"."set_type" AS ENUM('warmup', 'working', 'drop', 'rest_pause', 'myo_reps', 'amrap');--> statement-breakpoint
CREATE TYPE "public"."training_objective" AS ENUM('hypertrophy', 'strength', 'metabolic_stress', 'deload', 'other');--> statement-breakpoint
CREATE TYPE "public"."weight_unit" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"secondary_muscles" text[],
	"equipment" text,
	"media_url" text,
	"media_type" "media_type",
	"default_unit" "weight_unit" DEFAULT 'kg' NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mesocycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"objective" "training_objective" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mesocycles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"target_sets" integer,
	"target_reps" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "routine_exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"weight_unit" "weight_unit" DEFAULT 'kg' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "set_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"weight" numeric(6, 2),
	"reps" integer,
	"rpe" numeric(3, 1),
	"set_type" "set_type" DEFAULT 'working' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"rest_sec" integer
);
--> statement-breakpoint
ALTER TABLE "set_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid,
	"mesocycle_id" uuid,
	"session_type" "training_objective",
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"duration_min" integer
);
--> statement-breakpoint
ALTER TABLE "workout_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_entries" ADD CONSTRAINT "set_entries_session_exercise_id_session_exercises_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."session_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_mesocycle_id_mesocycles_id_fk" FOREIGN KEY ("mesocycle_id") REFERENCES "public"."mesocycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercises_muscle_group_idx" ON "exercises" USING btree ("muscle_group");--> statement-breakpoint
CREATE INDEX "mesocycles_user_id_idx" ON "mesocycles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "routine_exercises_routine_id_idx" ON "routine_exercises" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "routines_user_id_idx" ON "routines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_exercises_session_id_idx" ON "session_exercises" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "set_entries_session_exercise_id_idx" ON "set_entries" USING btree ("session_exercise_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_user_date_idx" ON "workout_sessions" USING btree ("user_id","date");