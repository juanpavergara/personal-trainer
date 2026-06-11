import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 512 512" className="h-16 w-16" aria-hidden="true">
          <rect width="512" height="512" rx="96" className="fill-neutral-900" />
          <g className="stroke-green-500" strokeWidth="40" strokeLinecap="round">
            <line x1="96" y1="186" x2="96" y2="326" />
            <line x1="166" y1="146" x2="166" y2="366" />
            <line x1="416" y1="186" x2="416" y2="326" />
            <line x1="346" y1="146" x2="346" y2="366" />
            <line x1="166" y1="256" x2="346" y2="256" />
          </g>
        </svg>
        <h1 className="text-2xl font-bold tracking-tight">Gym Tracker</h1>
      </div>

      <form className="flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Correo
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-base text-neutral-100 outline-none focus:border-green-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-base text-neutral-100 outline-none focus:border-green-600"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-950 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-green-500">
            {message}
          </p>
        )}

        <button
          formAction={login}
          className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white active:bg-green-700"
        >
          Entrar
        </button>
        <button
          formAction={signup}
          className="rounded-lg border border-neutral-800 px-4 py-3 font-semibold text-neutral-300 active:bg-neutral-900"
        >
          Crear cuenta
        </button>
      </form>
    </main>
  );
}
