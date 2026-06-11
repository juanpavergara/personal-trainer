import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  exercises,
  sessionExercises,
  setEntries,
  workoutSessions,
} from "@/db/schema";
import { getUser } from "@/lib/supabase/server";

// Historial de un ejercicio: todas las series pasadas del usuario,
// agrupadas por sesión (la base de los PRs y gráficos que vienen después)
export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return null;

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, id));
  if (!exercise) notFound();

  const rows = await db
    .select({
      set: setEntries,
      weightUnit: sessionExercises.weightUnit,
      sessionId: workoutSessions.id,
      sessionDate: workoutSessions.date,
    })
    .from(setEntries)
    .innerJoin(
      sessionExercises,
      eq(setEntries.sessionExerciseId, sessionExercises.id),
    )
    .innerJoin(
      workoutSessions,
      eq(sessionExercises.sessionId, workoutSessions.id),
    )
    .where(
      and(
        eq(sessionExercises.exerciseId, id),
        eq(workoutSessions.userId, user.id),
      ),
    )
    .orderBy(desc(workoutSessions.date), asc(setEntries.setNumber));

  // Agrupar por sesión conservando el orden por fecha descendente
  const bySession = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = bySession.get(row.sessionId) ?? [];
    list.push(row);
    bySession.set(row.sessionId, list);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-6">
        <Link href="/" className="text-ink-muted active:text-ink">
          ←
        </Link>
        <div>
          <h1 className="text-lg font-semibold">{exercise.name}</h1>
          <p className="text-sm text-ink-muted">{exercise.muscleGroup}</p>
        </div>
      </header>

      {bySession.size === 0 && (
        <p className="bg-surface px-4 py-4 text-sm text-ink-muted">
          Aún no has registrado series de este ejercicio.
        </p>
      )}

      {[...bySession.entries()].map(([sessionId, sessionRows]) => (
        <section key={sessionId}>
          <Link
            href={`/session/${sessionId}`}
            className="block bg-surface-alt px-4 py-2.5 text-sm font-medium text-ink-soft active:text-ink"
          >
            {new Date(sessionRows[0].sessionDate).toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Link>
          <ul className="bg-surface px-4 py-2">
            {sessionRows.map(({ set, weightUnit }) => (
              <li
                key={set.id}
                className="flex justify-between py-1.5 text-sm"
              >
                <span className="text-ink-soft">
                  {set.weight ?? "—"} {set.weight ? weightUnit : ""} ×{" "}
                  {set.reps ?? "—"}
                </span>
                <span className="text-ink-muted">
                  {set.rpe ? `RPE ${set.rpe}` : ""}
                  {set.setType !== "working" ? ` · ${set.setType}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
