/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
  exercises,
  routineExercises,
  routines,
  routineSets,
} from "@/db/schema";
import { getUser } from "@/lib/supabase/server";
import {
  addExerciseToRoutine,
  addRoutineSet,
  deleteRoutine,
  removeExerciseFromRoutine,
  removeRoutineSet,
} from "../actions";

export default async function RoutineEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return null;

  const [routine] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, id), eq(routines.userId, user.id)));
  if (!routine) notFound();

  const items = await db
    .select({
      re: routineExercises,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      mediaUrl: exercises.mediaUrl,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, id))
    .orderBy(asc(routineExercises.orderIndex));

  const sets =
    items.length > 0
      ? await db
          .select()
          .from(routineSets)
          .where(
            inArray(
              routineSets.routineExerciseId,
              items.map((i) => i.re.id),
            ),
          )
          .orderBy(asc(routineSets.setNumber))
      : [];

  // Volumen de la plantilla: sets efectivos por grupo muscular (spec ROUTINES.md)
  const setsByGroup = new Map<string, number>();
  for (const item of items) {
    const n = sets.filter((s) => s.routineExerciseId === item.re.id).length;
    setsByGroup.set(
      item.muscleGroup,
      (setsByGroup.get(item.muscleGroup) ?? 0) + n,
    );
  }

  const catalog = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(exercises)
    .where(or(isNull(exercises.ownerId), eq(exercises.ownerId, user.id)))
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-5">
      <header className="flex items-center gap-3">
        <Link
          href="/routines"
          className="text-neutral-500 active:text-neutral-300"
        >
          ←
        </Link>
        <h1 className="flex-1 text-xl font-bold">{routine.name}</h1>
        <form action={deleteRoutine}>
          <input type="hidden" name="routineId" value={id} />
          <button className="text-sm text-red-500 active:text-red-400">
            Eliminar
          </button>
        </form>
      </header>

      {setsByGroup.size > 0 && (
        <section className="rounded-xl bg-neutral-900 p-4">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Volumen de la plantilla (sets por grupo)
          </h2>
          <div className="flex flex-wrap gap-2">
            {[...setsByGroup.entries()].map(([group, n]) => (
              <span
                key={group}
                className="rounded-full bg-neutral-800 px-3 py-1 text-sm"
              >
                {group} <strong className="text-green-500">{n}</strong>
              </span>
            ))}
          </div>
        </section>
      )}

      {items.map(({ re, exerciseName, muscleGroup, mediaUrl }) => {
        const exerciseSets = sets.filter((s) => s.routineExerciseId === re.id);
        return (
          <section key={re.id} className="rounded-xl bg-neutral-900 p-4">
            <div className="mb-3 flex items-center gap-3">
              {mediaUrl && (
                <img
                  src={mediaUrl}
                  alt={`Ejecución de ${exerciseName}`}
                  className="h-12 w-12 rounded-lg bg-white object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">{exerciseName}</p>
                <p className="text-xs text-neutral-500">{muscleGroup}</p>
              </div>
              <form action={removeExerciseFromRoutine}>
                <input type="hidden" name="routineId" value={id} />
                <input type="hidden" name="routineExerciseId" value={re.id} />
                <button className="text-sm text-neutral-600 active:text-red-500">
                  ✕
                </button>
              </form>
            </div>

            <ul className="mb-3 flex flex-col gap-1">
              {exerciseSets.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between border-t border-neutral-800 py-1.5 text-sm"
                >
                  <span>
                    <span className="text-neutral-500">Set {s.setNumber}</span>{" "}
                    · {s.suggestedReps} reps
                  </span>
                  <form action={removeRoutineSet}>
                    <input type="hidden" name="routineId" value={id} />
                    <input
                      type="hidden"
                      name="routineExerciseId"
                      value={re.id}
                    />
                    <input type="hidden" name="setId" value={s.id} />
                    <button className="px-2 text-neutral-600 active:text-red-500">
                      −
                    </button>
                  </form>
                </li>
              ))}
            </ul>

            <form action={addRoutineSet} className="flex gap-2">
              <input type="hidden" name="routineId" value={id} />
              <input type="hidden" name="routineExerciseId" value={re.id} />
              <input
                name="suggestedReps"
                placeholder="Reps sugeridas (ej. 8-12)"
                className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-green-600"
              />
              <button className="rounded-lg bg-neutral-800 px-3 py-2 text-sm font-semibold active:bg-neutral-700">
                + set
              </button>
            </form>
          </section>
        );
      })}

      <section className="rounded-xl border border-dashed border-neutral-800 p-4">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Añadir ejercicio
        </h2>
        <form action={addExerciseToRoutine} className="flex gap-2">
          <input type="hidden" name="routineId" value={id} />
          <select
            name="exerciseId"
            required
            className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2.5 text-base"
          >
            {catalog.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.muscleGroup})
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white active:bg-green-700">
            +
          </button>
        </form>
      </section>
    </main>
  );
}
