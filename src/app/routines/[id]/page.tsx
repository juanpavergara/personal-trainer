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
import { SectionLabel } from "@/components/ui";
import { RoutineView } from "./routine-view";

export default async function RoutineDetailPage({
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

  const rows = await db
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
    rows.length > 0
      ? await db
          .select()
          .from(routineSets)
          .where(
            inArray(
              routineSets.routineExerciseId,
              rows.map((r) => r.re.id),
            ),
          )
          .orderBy(asc(routineSets.setNumber))
      : [];

  const items = rows.map((r) => ({
    id: r.re.id,
    exerciseName: r.exerciseName,
    muscleGroup: r.muscleGroup,
    mediaUrl: r.mediaUrl,
    sets: sets
      .filter((s) => s.routineExerciseId === r.re.id)
      .map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        suggestedReps: s.suggestedReps,
      })),
  }));

  // Volumen de la plantilla: sets efectivos por grupo muscular (spec ROUTINES.md)
  const setsByGroup = new Map<string, number>();
  for (const item of items) {
    setsByGroup.set(
      item.muscleGroup,
      (setsByGroup.get(item.muscleGroup) ?? 0) + item.sets.length,
    );
  }

  const catalog = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      mediaUrl: exercises.mediaUrl,
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

      <RoutineView routineId={id} items={items} catalog={catalog} />
    </main>
  );
}
