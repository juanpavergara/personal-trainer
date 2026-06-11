"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  exercises,
  routineExercises,
  routines,
  routineSets,
} from "@/db/schema";
import { getUser } from "@/lib/supabase/server";

/** Verifica que la rutina exista y pertenezca al usuario autenticado. */
async function assertOwnRoutine(routineId: string, userId: string) {
  const [routine] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  if (!routine) throw new Error("Rutina no encontrada");
}

/** Verifica que el routine_exercise pertenezca a esa rutina (ya validada). */
async function assertExerciseInRoutine(
  routineExerciseId: string,
  routineId: string,
) {
  const [re] = await db
    .select({ id: routineExercises.id })
    .from(routineExercises)
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(routineExercises.routineId, routineId),
      ),
    );
  if (!re) throw new Error("Ejercicio no pertenece a la rutina");
}

export async function createRoutine(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const [routine] = await db
    .insert(routines)
    .values({ userId: user.id, name })
    .returning({ id: routines.id });

  redirect(`/routines/${routine.id}`);
}

export async function deleteRoutine(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const routineId = formData.get("routineId") as string;
  await assertOwnRoutine(routineId, user.id);

  // Cascade borra routine_exercises y routine_sets. Las sesiones pasadas no se
  // tocan: son snapshots independientes (docs/specs/ROUTINES.md).
  await db.delete(routines).where(eq(routines.id, routineId));
  redirect("/routines");
}

export async function addExerciseToRoutine(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const routineId = formData.get("routineId") as string;
  const exerciseId = formData.get("exerciseId") as string;
  await assertOwnRoutine(routineId, user.id);

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
    .from(routineExercises)
    .where(eq(routineExercises.routineId, routineId));

  const [re] = await db
    .insert(routineExercises)
    .values({ routineId, exerciseId, orderIndex: count + 1 })
    .returning({ id: routineExercises.id });

  // Por defecto, 3 sets de 8-12 (ajustables): evita plantillas vacías
  await db.insert(routineSets).values(
    [1, 2, 3].map((n) => ({
      routineExerciseId: re.id,
      setNumber: n,
      suggestedReps: "8-12",
    })),
  );

  revalidatePath(`/routines/${routineId}`);
}

export async function removeExerciseFromRoutine(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const routineId = formData.get("routineId") as string;
  const routineExerciseId = formData.get("routineExerciseId") as string;
  await assertOwnRoutine(routineId, user.id);

  await db
    .delete(routineExercises)
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(routineExercises.routineId, routineId),
      ),
    );

  revalidatePath(`/routines/${routineId}`);
}

export async function addRoutineSet(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const routineId = formData.get("routineId") as string;
  const routineExerciseId = formData.get("routineExerciseId") as string;
  const suggestedReps =
    (formData.get("suggestedReps") as string)?.trim() || "8-12";
  await assertOwnRoutine(routineId, user.id);
  await assertExerciseInRoutine(routineExerciseId, routineId);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(routineSets)
    .where(eq(routineSets.routineExerciseId, routineExerciseId));

  await db.insert(routineSets).values({
    routineExerciseId,
    setNumber: count + 1,
    suggestedReps,
  });

  revalidatePath(`/routines/${routineId}`);
}

export async function removeRoutineSet(formData: FormData) {
  const user = await getUser();
  if (!user) return;

  const routineId = formData.get("routineId") as string;
  const routineExerciseId = formData.get("routineExerciseId") as string;
  const setId = formData.get("setId") as string;
  await assertOwnRoutine(routineId, user.id);
  await assertExerciseInRoutine(routineExerciseId, routineId);

  await db
    .delete(routineSets)
    .where(
      and(
        eq(routineSets.id, setId),
        eq(routineSets.routineExerciseId, routineExerciseId),
      ),
    );

  revalidatePath(`/routines/${routineId}`);
}
