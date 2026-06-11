import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { routineExercises, routines } from "@/db/schema";
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
        {list.map((r, i) => (
          <Link
            key={r.id}
            href={`/routines/${r.id}`}
            className={`flex items-center justify-between px-4 py-3.5 active:bg-surface-alt ${
              i % 2 === 0 ? "bg-surface" : "bg-surface-alt/60"
            }`}
          >
            <span className="font-medium">{r.name}</span>
            <span className="text-sm text-ink-muted">
              {r.exerciseCount} ejercicio{r.exerciseCount === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
