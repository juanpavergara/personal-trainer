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
import { Input, PrimaryButton, Select, SectionLabel } from "@/components/ui";
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-6">
        <Link href="/" className="text-ink-muted active:text-ink">
          ←
        </Link>
        <h1 className="text-lg font-semibold">
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
          <section key={se.id}>
            <div className="flex items-center justify-between bg-surface-alt px-4 py-3">
              <Link
                href={`/exercises/${se.exerciseId}`}
                className="font-medium text-accent active:opacity-70"
              >
                {exerciseName} →
              </Link>
              <span className="text-xs text-ink-muted">{se.weightUnit}</span>
            </div>

            <div className="bg-surface px-4 py-3">
              {exerciseSets.length > 0 && (
                <table className="mb-3 w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-ink-muted">
                      <th className="py-1 font-medium">#</th>
                      <th className="py-1 font-medium">Peso</th>
                      <th className="py-1 font-medium">Reps</th>
                      <th className="py-1 font-medium">RPE</th>
                      <th className="py-1 font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exerciseSets.map((s) => (
                      <tr key={s.id}>
                        <td className="py-1.5 text-ink-muted">{s.setNumber}</td>
                        <td className="py-1.5 text-ink-soft">
                          {s.weight ?? "—"} {s.weight ? se.weightUnit : ""}
                        </td>
                        <td className="py-1.5 text-ink-soft">{s.reps ?? "—"}</td>
                        <td className="py-1.5 text-ink-soft">{s.rpe ?? "—"}</td>
                        <td className="py-1.5 text-xs text-ink-muted">
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
                <label className="flex flex-1 basis-16 flex-col gap-1 text-xs text-ink-muted">
                  Peso
                  <Input
                    name="weight"
                    type="number"
                    step="0.25"
                    min="0"
                    inputMode="decimal"
                    className="w-full"
                  />
                </label>
                <label className="flex flex-1 basis-14 flex-col gap-1 text-xs text-ink-muted">
                  Reps
                  <Input
                    name="reps"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="w-full"
                  />
                </label>
                <label className="flex flex-1 basis-14 flex-col gap-1 text-xs text-ink-muted">
                  RPE
                  <Input
                    name="rpe"
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    inputMode="decimal"
                    className="w-full"
                  />
                </label>
                <label className="flex flex-1 basis-24 flex-col gap-1 text-xs text-ink-muted">
                  Tipo
                  <Select name="setType" defaultValue="working" className="w-full">
                    {Object.entries(SET_TYPE_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
                <PrimaryButton>+</PrimaryButton>
              </form>
            </div>
          </section>
        );
      })}

      <div className="px-4 pb-2 pt-6">
        <SectionLabel>Añadir ejercicio</SectionLabel>
      </div>
      <div className="bg-surface px-4 py-3">
        <form action={addExerciseToSession} className="flex items-end gap-2">
          <input type="hidden" name="sessionId" value={id} />
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-ink-muted">
            Ejercicio
            <Select name="exerciseId" required className="w-full">
              {catalog.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.muscleGroup})
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-muted">
            Unidad
            <Select name="weightUnit" defaultValue="kg">
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </Select>
          </label>
          <PrimaryButton>+</PrimaryButton>
        </form>
      </div>
    </main>
  );
}
