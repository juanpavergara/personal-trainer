import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { routineExercises, routines } from "@/db/schema";
import { getUser } from "@/lib/supabase/server";
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-5">
      <header className="flex items-center gap-3">
        <Link href="/" className="text-neutral-500 active:text-neutral-300">
          ←
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Rutinas</h1>
      </header>

      <form action={createRoutine} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="Nombre (ej. Día de empuje A)"
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-green-600"
        />
        <button className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white active:bg-green-700">
          Crear
        </button>
      </form>

      <section className="flex flex-col gap-2">
        {list.length === 0 && (
          <p className="rounded-xl bg-neutral-900 p-4 text-neutral-400">
            Aún no tienes rutinas. Crea la primera arriba.
          </p>
        )}
        {list.map((r) => (
          <Link
            key={r.id}
            href={`/routines/${r.id}`}
            className="flex items-center justify-between rounded-xl bg-neutral-900 p-4 active:bg-neutral-800"
          >
            <span className="font-medium">{r.name}</span>
            <span className="text-sm text-neutral-500">
              {r.exerciseCount} ejercicio{r.exerciseCount === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
