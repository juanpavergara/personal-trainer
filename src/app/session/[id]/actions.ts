"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  exercises,
  sessionExercises,
  setEntries,
  workoutSessions,
} from "@/db/schema";
import { getUser } from "@/lib/supabase/server";

/** Verifica que la sesión exista y pertenezca al usuario autenticado. */
async function assertOwnSession(sessionId: string, userId: string) {
  const [session] = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)),
    );
  if (!session) throw new Error("Sesión no encontrada");
}

export async function addExerciseToSession(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const sessionId = formData.get("sessionId") as string;
  const exerciseId = formData.get("exerciseId") as string;
  const weightUnit = formData.get("weightUnit") as "kg" | "lb";
  await assertOwnSession(sessionId, user.id);

  // El ejercicio debe ser global o del propio usuario
  const [exercise] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(
      and(
        eq(exercises.id, exerciseId),
        or(isNull(exercises.ownerId), eq(exercises.ownerId, user.id)),
      ),
    );
  if (!exercise) throw new Error("Ejercicio no encontrado");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId));

  await db.insert(sessionExercises).values({
    sessionId,
    exerciseId,
    orderIndex: count + 1,
    weightUnit,
  });

  revalidatePath(`/session/${sessionId}`);
}

export async function addSet(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const sessionId = formData.get("sessionId") as string;
  const sessionExerciseId = formData.get("sessionExerciseId") as string;
  await assertOwnSession(sessionId, user.id);

  const weight = formData.get("weight") as string;
  const reps = formData.get("reps") as string;
  const rpe = formData.get("rpe") as string;
  const setType = formData.get("setType") as
    | "warmup"
    | "working"
    | "drop"
    | "rest_pause"
    | "myo_reps"
    | "amrap";

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(setEntries)
    .where(eq(setEntries.sessionExerciseId, sessionExerciseId));

  await db.insert(setEntries).values({
    sessionExerciseId,
    setNumber: count + 1,
    weight: weight || null,
    reps: reps ? Number(reps) : null,
    rpe: rpe || null,
    setType: setType || "working",
    completed: true, // registrada a mano = hecha
  });

  revalidatePath(`/session/${sessionId}`);
}
