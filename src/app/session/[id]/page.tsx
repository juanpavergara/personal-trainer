import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
  exercises,
  sessionExercises,
  setEntries,
  workoutSessions,
} from "@/db/schema";
import { getUser } from "@/lib/supabase/server";
import { addExerciseToSession, addSet } from "./actions";

const SET_TYPE_LABELS: Record<string, string> = {
  warmup: "Calent.",
  working: "Efectivo",
  drop: "Drop",
  rest_pause: "Rest-pause",
  myo_reps: "Myo-reps",
  amrap: "AMRAP",
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return null;

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, user.id)));
  if (!session) notFound();

  const items = await db
    .select({
      se: sessionExercises,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, id))
    .orderBy(asc(sessionExercises.orderIndex));

  const sets =
    items.length > 0
      ? await db
          .select()
          .from(setEntries)
          .where(
            or(...items.map((i) => eq(setEntries.sessionExerciseId, i.se.id))),
          )
          .orderBy(asc(setEntries.setNumber))
      : [];

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
        <Link href="/" className="text-neutral-500 active:text-neutral-300">
          ←
        </Link>
        <h1 className="text-xl font-bold">
          Sesión ·{" "}
          {new Date(session.date).toLocaleDateString("es", {
            day: "numeric",
            month: "short",
          })}
        </h1>
      </header>

      {items.map(({ se, exerciseName }) => {
        const exerciseSets = sets.filter((s) => s.sessionExerciseId === se.id);
        return (
          <section key={se.id} className="rounded-xl bg-neutral-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <Link
                href={`/exercises/${se.exerciseId}`}
                className="font-semibold text-green-500 active:text-green-400"
              >
                {exerciseName} →
              </Link>
              <span className="text-xs text-neutral-500">{se.weightUnit}</span>
            </div>

            {exerciseSets.length > 0 && (
              <table className="mb-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-neutral-600">
                    <th className="py-1 font-medium">#</th>
                    <th className="py-1 font-medium">Peso</th>
                    <th className="py-1 font-medium">Reps</th>
                    <th className="py-1 font-medium">RPE</th>
                    <th className="py-1 font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {exerciseSets.map((s) => (
                    <tr key={s.id} className="border-t border-neutral-800">
                      <td className="py-2 text-neutral-500">{s.setNumber}</td>
                      <td className="py-2">
                        {s.weight ?? "—"} {s.weight ? se.weightUnit : ""}
                      </td>
                      <td className="py-2">{s.reps ?? "—"}</td>
                      <td className="py-2">{s.rpe ?? "—"}</td>
                      <td className="py-2 text-xs text-neutral-400">
                        {SET_TYPE_LABELS[s.setType]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <form action={addSet} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="sessionId" value={id} />
              <input type="hidden" name="sessionExerciseId" value={se.id} />
              <label className="flex flex-1 basis-16 flex-col gap-1 text-xs text-neutral-500">
                Peso
                <input
                  name="weight"
                  type="number"
                  step="0.25"
                  min="0"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 text-base"
                />
              </label>
              <label className="flex flex-1 basis-14 flex-col gap-1 text-xs text-neutral-500">
                Reps
                <input
                  name="reps"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 text-base"
                />
              </label>
              <label className="flex flex-1 basis-14 flex-col gap-1 text-xs text-neutral-500">
                RPE
                <input
                  name="rpe"
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 text-base"
                />
              </label>
              <label className="flex flex-1 basis-24 flex-col gap-1 text-xs text-neutral-500">
                Tipo
                <select
                  name="setType"
                  defaultValue="working"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2.5 text-base"
                >
                  {Object.entries(SET_TYPE_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white active:bg-green-700">
                +
              </button>
            </form>
          </section>
        );
      })}

      <section className="rounded-xl border border-dashed border-neutral-800 p-4">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Añadir ejercicio
        </h2>
        <form action={addExerciseToSession} className="flex items-end gap-2">
          <input type="hidden" name="sessionId" value={id} />
          <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
            Ejercicio
            <select
              name="exerciseId"
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2.5 text-base"
            >
              {catalog.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.muscleGroup})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Unidad
            <select
              name="weightUnit"
              defaultValue="kg"
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2.5 text-base"
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </label>
          <button className="rounded-lg bg-neutral-800 px-4 py-2.5 font-semibold text-neutral-200 active:bg-neutral-700">
            +
          </button>
        </form>
      </section>
    </main>
  );
}
