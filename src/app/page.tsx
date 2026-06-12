import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
import { getUser } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/ui";
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center justify-between px-4 pb-4 pt-6">
        <h1 className="text-xl font-semibold tracking-tight">Gym Tracker</h1>
        <form action={logout}>
          <button className="text-sm text-ink-muted active:text-ink">
            Salir
          </button>
        </form>
      </header>

      <form action={createSession}>
        <button className="w-full bg-accent px-4 py-4 text-base font-medium text-white active:opacity-80">
          + Nueva sesión
        </button>
      </form>

      <Link
        href="/routines"
        className="mt-2 block w-full bg-accent px-4 py-4 text-center text-base font-medium text-white active:opacity-80"
      >
        Rutinas
      </Link>

      <div className="px-4 pb-2 pt-6">
        <SectionLabel>Sesiones recientes</SectionLabel>
      </div>

      {sessions.length === 0 && (
        <p className="bg-surface px-4 py-4 text-sm text-ink-muted">
          Aún no hay sesiones. Empieza tu primer entrenamiento.
        </p>
      )}
      {sessions.map((s, i) => (
        <Link
          key={s.id}
          href={`/session/${s.id}`}
          className={`flex items-center justify-between px-4 py-3.5 active:bg-surface-alt ${
            i % 2 === 0 ? "bg-surface" : "bg-surface-alt/60"
          }`}
        >
          <span className="font-medium">
            {new Date(s.date).toLocaleDateString("es", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="text-sm text-ink-muted">
            {new Date(s.date).toLocaleTimeString("es", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </Link>
      ))}
    </main>
  );
}
