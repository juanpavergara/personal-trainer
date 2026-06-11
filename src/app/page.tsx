export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <svg viewBox="0 0 512 512" className="h-20 w-20" aria-hidden="true">
        <rect width="512" height="512" rx="96" className="fill-neutral-900" />
        <g className="stroke-green-500" strokeWidth="40" strokeLinecap="round">
          <line x1="96" y1="186" x2="96" y2="326" />
          <line x1="166" y1="146" x2="166" y2="366" />
          <line x1="416" y1="186" x2="416" y2="326" />
          <line x1="346" y1="146" x2="346" y2="366" />
          <line x1="166" y1="256" x2="346" y2="256" />
        </g>
      </svg>
      <h1 className="text-3xl font-bold tracking-tight">Gym Tracker</h1>
      <p className="max-w-sm text-neutral-400">
        Series, mesociclos, PRs y progresión de cargas. En construcción —
        primera URL viva del proyecto.
      </p>
      <p className="rounded-full bg-neutral-900 px-4 py-1 text-sm text-green-500">
        Despliegue verificado ✓
      </p>
    </main>
  );
}
