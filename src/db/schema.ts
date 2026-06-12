import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Enums — ver docs/DATA_MODEL.md y ADR-009 (tipos de set)
export const weightUnitEnum = pgEnum("weight_unit", ["kg", "lb"]);

export const setTypeEnum = pgEnum("set_type", [
  "warmup",
  "working",
  "drop",
  "rest_pause",
  "myo_reps",
  "amrap",
]);

export const trainingObjectiveEnum = pgEnum("training_objective", [
  "hypertrophy",
  "strength",
  "metabolic_stress",
  "deload",
  "maintenance",
  "other",
]);

export const mediaTypeEnum = pgEnum("media_type", [
  "video",
  "gif",
  "animation",
  "image",
]);

// Catálogo de ejercicios: globales (owner_id null) + personalizados por usuario
export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    muscleGroup: text("muscle_group").notNull(),
    secondaryMuscles: text("secondary_muscles").array(),
    equipment: text("equipment"),
    mediaUrl: text("media_url"),
    mediaType: mediaTypeEnum("media_type"),
    instructions: text("instructions").array(), // pasos de ejecución
    sourceId: text("source_id"), // exerciseId en AscendAPI (import idempotente)
    defaultUnit: weightUnitEnum("default_unit").notNull().default("kg"),
    isCustom: boolean("is_custom").notNull().default(false),
    ownerId: uuid("owner_id"), // referencia lógica a auth.users
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("exercises_muscle_group_idx").on(t.muscleGroup),
    uniqueIndex("exercises_source_id_idx").on(t.sourceId),
  ],
).enableRLS();

// Bloque de entrenamiento con fechas y objetivo; condiciona el motor de progresión
export const mesocycles = pgTable(
  "mesocycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    objective: trainingObjectiveEnum("objective").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("mesocycles_user_id_idx").on(t.userId)],
).enableRLS();

// Plantilla reutilizable ("Día de empuje A"). Ver docs/specs/ROUTINES.md
export const routines = pgTable(
  "routines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    // Una rutina puede pertenecer a un mesociclo o ser independiente
    mesocycleId: uuid("mesocycle_id").references(() => mesocycles.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("routines_user_id_idx").on(t.userId)],
).enableRLS();

export const routineExercises = pgTable(
  "routine_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    orderIndex: integer("order_index").notNull(),
    notes: text("notes"),
  },
  (t) => [index("routine_exercises_routine_id_idx").on(t.routineId)],
).enableRLS();

// Sets de plantilla: la rutina tiene granularidad por set, solo con reps
// sugeridas — NUNCA peso (el peso lo propone el motor de progresión).
export const routineSets = pgTable(
  "routine_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routineExerciseId: uuid("routine_exercise_id")
      .notNull()
      .references(() => routineExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    suggestedReps: text("suggested_reps").notNull(), // "8", "8-12", "AMRAP"
  },
  (t) => [
    index("routine_sets_routine_exercise_id_idx").on(t.routineExerciseId),
  ],
).enableRLS();

// Un entrenamiento real en una fecha
export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    routineId: uuid("routine_id").references(() => routines.id, {
      onDelete: "set null",
    }),
    mesocycleId: uuid("mesocycle_id").references(() => mesocycles.id, {
      onDelete: "set null",
    }),
    // hereda del mesociclo por defecto; se puede cambiar por sesión
    sessionType: trainingObjectiveEnum("session_type"),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    durationMin: integer("duration_min"),
  },
  (t) => [index("workout_sessions_user_date_idx").on(t.userId, t.date)],
).enableRLS();

// Un ejercicio dentro de una sesión. La unidad de peso vive AQUÍ:
// por ejercicio y por sesión (decisión de producto, ver DATA_MODEL.md)
export const sessionExercises = pgTable(
  "session_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    orderIndex: integer("order_index").notNull(),
    weightUnit: weightUnitEnum("weight_unit").notNull().default("kg"),
  },
  (t) => [index("session_exercises_session_id_idx").on(t.sessionId)],
).enableRLS();

// La unidad mínima del tracking. Fallo = rpe 10 / RIR 0, no es un tipo (ADR-009)
export const setEntries = pgTable(
  "set_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionExerciseId: uuid("session_exercise_id")
      .notNull()
      .references(() => sessionExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    weight: numeric("weight", { precision: 6, scale: 2 }),
    reps: integer("reps"),
    rpe: numeric("rpe", { precision: 3, scale: 1 }),
    setType: setTypeEnum("set_type").notNull().default("working"),
    completed: boolean("completed").notNull().default(false),
    restSec: integer("rest_sec"),
  },
  (t) => [index("set_entries_session_exercise_id_idx").on(t.sessionExerciseId)],
).enableRLS();
