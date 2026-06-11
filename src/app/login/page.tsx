import { Input, PrimaryButton } from "@/components/ui";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <div className="bg-surface px-6 py-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <svg viewBox="0 0 512 512" className="h-14 w-14" aria-hidden="true">
            <g
              className="stroke-accent"
              strokeWidth="40"
              strokeLinecap="square"
            >
              <line x1="96" y1="186" x2="96" y2="326" />
              <line x1="166" y1="146" x2="166" y2="366" />
              <line x1="416" y1="186" x2="416" y2="326" />
              <line x1="346" y1="146" x2="346" y2="366" />
              <line x1="166" y1="256" x2="346" y2="256" />
            </g>
          </svg>
          <h1 className="text-xl font-semibold tracking-tight">Gym Tracker</h1>
        </div>

        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Correo
            <Input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Contraseña
            <Input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}
          {message && <p className="text-sm text-accent">{message}</p>}

          <PrimaryButton formAction={login} className="mt-2 py-3">
            Entrar
          </PrimaryButton>
          <button
            formAction={signup}
            className="py-2 text-sm font-medium text-accent active:opacity-70"
          >
            Crear cuenta
          </button>
        </form>
      </div>
    </main>
  );
}
