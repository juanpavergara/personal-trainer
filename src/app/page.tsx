import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
import { getUser } from "@/lib/supabase/server";
import { createSession } from "./actions";
import { logout } from "./login/actions";

export default async function Home() {
  const user = await getUser();
  if (!user) return null; // el proxy redirige a /login

  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, user.id))
    .orderBy(desc(workoutSessions.date))
    .limit(20);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gym Tracker</h1>
        <form action={logout}>
          <button className="text-sm text-neutral-500 active:text-neutral-300">
            Salir
          </button>
        </form>
      </header>

      <form action={createSession}>
        <button className="w-full rounded-xl bg-green-600 px-4 py-4 text-lg font-semibold text-white active:bg-green-700">
          + Nueva sesión
        </button>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Sesiones recientes
        </h2>
        {sessions.length === 0 && (
          <p className="rounded-xl bg-neutral-900 p-4 text-neutral-400">
            Aún no hay sesiones. Empieza tu primer entrenamiento.
          </p>
        )}
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/session/${s.id}`}
            className="flex items-center justify-between rounded-xl bg-neutral-900 p-4 active:bg-neutral-800"
          >
            <span className="font-medium">
              {new Date(s.date).toLocaleDateString("es", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="text-sm text-neutral-500">
              {new Date(s.date).toLocaleTimeString("es", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
