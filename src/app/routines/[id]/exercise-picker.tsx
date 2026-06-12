/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui";
import { addExerciseToRoutine } from "../actions";

type CatalogExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  mediaUrl: string | null;
};

const MAX_RESULTS = 30;

/** Búsqueda insensible a mayúsculas y tildes ("press inclinado" ↔ "Press Inclinado"). */
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function ExercisePicker({
  routineId,
  catalog,
}: {
  routineId: string;
  catalog: CatalogExercise[];
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);

  const groups = useMemo(
    () => [...new Set(catalog.map((e) => e.muscleGroup))].sort(),
    [catalog],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return catalog.filter(
      (e) =>
        (!group || e.muscleGroup === group) &&
        (!q || normalize(e.name).includes(q)),
    );
  }, [catalog, query, group]);

  const shown = filtered.slice(0, MAX_RESULTS);

  return (
    <div className="bg-surface">
      <div className="px-4 pt-3">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio…"
          className="w-full"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-3">
        <button
          type="button"
          onClick={() => setGroup(null)}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium ${
            group === null
              ? "bg-accent text-white"
              : "bg-surface-alt text-ink-soft active:bg-base"
          }`}
        >
          Todos
        </button>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(group === g ? null : g)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium capitalize ${
              group === g
                ? "bg-accent text-white"
                : "bg-surface-alt text-ink-soft active:bg-base"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-ink-muted">
          Sin resultados{query && ` para “${query.trim()}”`}.
        </p>
      ) : (
        <ul>
          {shown.map((e) => (
            <li key={e.id}>
              <form action={addExerciseToRoutine}>
                <input type="hidden" name="routineId" value={routineId} />
                <input type="hidden" name="exerciseId" value={e.id} />
                <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-alt">
                  {e.mediaUrl && (
                    <img
                      src={e.mediaUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 bg-white object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {e.name}
                    </span>
                    <span className="block text-xs capitalize text-ink-muted">
                      {e.muscleGroup}
                    </span>
                  </span>
                  <span className="font-medium text-accent">+</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > MAX_RESULTS && (
        <p className="px-4 pb-3 pt-1 text-xs text-ink-faint">
          Mostrando {MAX_RESULTS} de {filtered.length} — refina la búsqueda.
        </p>
      )}
    </div>
  );
}
