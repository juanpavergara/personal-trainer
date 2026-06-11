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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-5">
      <header className="flex items-center gap-3">
        <Link href="/" className="text-neutral-500 active:text-neutral-300">
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">{exercise.name}</h1>
          <p className="text-sm text-neutral-500">{exercise.muscleGroup}</p>
        </div>
      </header>

      {bySession.size === 0 && (
        <p className="rounded-xl bg-neutral-900 p-4 text-neutral-400">
          Aún no has registrado series de este ejercicio.
        </p>
      )}

      {[...bySession.entries()].map(([sessionId, sessionRows]) => (
        <section key={sessionId} className="rounded-xl bg-neutral-900 p-4">
          <Link
            href={`/session/${sessionId}`}
            className="mb-2 block text-sm font-semibold text-neutral-400 active:text-neutral-200"
          >
            {new Date(sessionRows[0].sessionDate).toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Link>
          <ul className="flex flex-col gap-1 text-sm">
            {sessionRows.map(({ set, weightUnit }) => (
              <li
                key={set.id}
                className="flex justify-between border-t border-neutral-800 py-1.5"
              >
                <span>
                  {set.weight ?? "—"} {set.weight ? weightUnit : ""} ×{" "}
                  {set.reps ?? "—"}
                </span>
                <span className="text-neutral-500">
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
