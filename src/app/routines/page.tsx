import Link from "next/link";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, routineExercises, routines, routineSets } from "@/db/schema";
import { getUser } from "@/lib/supabase/server";
import { Input, PrimaryButton } from "@/components/ui";
import { createRoutine } from "./actions";

export default async function RoutinesPage() {
  const user = await getUser();
  if (!user) return null;

  const list = await db
    .select({
      id: routines.id,
      name: routines.name,
      exerciseCount: sql<number>`count(${routineExercises.id})::int`,
    })
    .from(routines)
    .leftJoin(routineExercises, eq(routineExercises.routineId, routines.id))
    .where(eq(routines.userId, user.id))
    .groupBy(routines.id)
    .orderBy(desc(routines.createdAt));

  // Detalle por rutina: ejercicios (en orden) con sus sets para el resumen
  // y el volumen por grupo muscular.
  const details =
    list.length > 0
      ? await db
          .select({
            routineId: routineExercises.routineId,
            exerciseName: exercises.name,
            muscleGroup: exercises.muscleGroup,
            setCount: sql<number>`count(${routineSets.id})::int`,
          })
          .from(routineExercises)
          .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
          .leftJoin(
            routineSets,
            eq(routineSets.routineExerciseId, routineExercises.id),
          )
          .where(
            inArray(
              routineExercises.routineId,
              list.map((r) => r.id),
            ),
          )
          .groupBy(routineExercises.id, exercises.name, exercises.muscleGroup)
          .orderBy(asc(routineExercises.orderIndex))
      : [];

  const exerciseNames = new Map<string, string[]>();
  const volumeByGroup = new Map<string, Map<string, number>>();
  for (const d of details) {
    exerciseNames.set(d.routineId, [
      ...(exerciseNames.get(d.routineId) ?? []),
      d.exerciseName,
    ]);
    const groups = volumeByGroup.get(d.routineId) ?? new Map<string, number>();
    groups.set(d.muscleGroup, (groups.get(d.muscleGroup) ?? 0) + d.setCount);
    volumeByGroup.set(d.routineId, groups);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-6">
        <Link href="/" className="text-ink-muted active:text-ink">
          ←
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Rutinas</h1>
      </header>

      <div className="bg-surface px-4 py-3">
        <form action={createRoutine} className="flex gap-2">
          <Input
            name="name"
            required
            placeholder="Nombre (ej. Día de empuje A)"
            className="min-w-0 flex-1"
          />
          <PrimaryButton>Crear</PrimaryButton>
        </form>
      </div>

      <div className="pt-4">
        {list.length === 0 && (
          <p className="bg-surface px-4 py-4 text-sm text-ink-muted">
            Aún no tienes rutinas. Crea la primera arriba.
          </p>
        )}
        {list.map((r, i) => {
          const volume = [...(volumeByGroup.get(r.id) ?? new Map()).entries()];
          const names = exerciseNames.get(r.id) ?? [];
          return (
            <Link
              key={r.id}
              href={`/routines/${r.id}`}
              className={`block px-4 py-3.5 active:bg-surface-alt ${
                i % 2 === 0 ? "bg-surface" : "bg-surface-alt/60"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">{r.name}</span>
                <span className="text-sm text-ink-muted">
                  {r.exerciseCount} ejercicio{r.exerciseCount === 1 ? "" : "s"}
                </span>
              </span>
              {volume.length > 0 && (
                <span className="mt-1 block text-xs capitalize text-ink-soft">
                  {volume.map(([group, n], j) => (
                    <span key={group}>
                      {j > 0 && <span className="text-ink-faint"> · </span>}
                      {group}{" "}
                      <strong className="font-semibold text-accent">{n}</strong>
                    </span>
                  ))}
                </span>
              )}
              {names.length > 0 && (
                <span className="mt-1 line-clamp-2 block text-xs text-ink-muted">
                  {names.join(" · ")}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
