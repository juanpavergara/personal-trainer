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
import { Input, PrimaryButton, Select, SectionLabel } from "@/components/ui";
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-6">
        <Link href="/routines" className="text-ink-muted active:text-ink">
          ←
        </Link>
        <h1 className="flex-1 text-lg font-semibold">{routine.name}</h1>
        <form action={deleteRoutine}>
          <input type="hidden" name="routineId" value={id} />
          <button className="text-sm text-danger active:opacity-70">
            Eliminar
          </button>
        </form>
      </header>

      {setsByGroup.size > 0 && (
        <div className="bg-surface px-4 py-3">
          <SectionLabel>Volumen de la plantilla</SectionLabel>
          <p className="mt-1.5 text-sm text-ink-soft">
            {[...setsByGroup.entries()].map(([group, n], i) => (
              <span key={group}>
                {i > 0 && <span className="text-ink-faint"> · </span>}
                {group}{" "}
                <strong className="font-semibold text-accent">{n}</strong>
              </span>
            ))}
          </p>
        </div>
      )}

      {items.map(({ re, exerciseName, muscleGroup, mediaUrl }) => {
        const exerciseSets = sets.filter((s) => s.routineExerciseId === re.id);
        return (
          <section key={re.id}>
            <div className="mt-4 flex items-center gap-3 bg-surface-alt px-4 py-3">
              {mediaUrl && (
                <img
                  src={mediaUrl}
                  alt={`Ejecución de ${exerciseName}`}
                  className="h-12 w-12 bg-white object-cover"
                  loading="lazy"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{exerciseName}</p>
                <p className="text-xs text-ink-muted">{muscleGroup}</p>
              </div>
              <form action={removeExerciseFromRoutine}>
                <input type="hidden" name="routineId" value={id} />
                <input type="hidden" name="routineExerciseId" value={re.id} />
                <button className="px-1 text-ink-faint active:text-danger">
                  ✕
                </button>
              </form>
            </div>

            <div className="bg-surface px-4 py-2">
              <ul>
                {exerciseSets.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <span className="text-ink-soft">
                      <span className="text-ink-muted">Set {s.setNumber}</span>{" "}
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
                      <button className="px-2 text-ink-faint active:text-danger">
                        −
                      </button>
                    </form>
                  </li>
                ))}
              </ul>

              <form action={addRoutineSet} className="flex gap-2 py-2">
                <input type="hidden" name="routineId" value={id} />
                <input type="hidden" name="routineExerciseId" value={re.id} />
                <Input
                  name="suggestedReps"
                  placeholder="Reps sugeridas (ej. 8-12)"
                  className="min-w-0 flex-1 text-sm"
                />
                <button className="px-3 text-sm font-medium text-accent active:opacity-70">
                  + set
                </button>
              </form>
            </div>
          </section>
        );
      })}

      <div className="px-4 pb-2 pt-6">
        <SectionLabel>Añadir ejercicio</SectionLabel>
      </div>
      <div className="bg-surface px-4 py-3">
        <form action={addExerciseToRoutine} className="flex gap-2">
          <input type="hidden" name="routineId" value={id} />
          <Select name="exerciseId" required className="min-w-0 flex-1">
            {catalog.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.muscleGroup})
              </option>
            ))}
          </Select>
          <PrimaryButton>+</PrimaryButton>
        </form>
      </div>
    </main>
  );
}
