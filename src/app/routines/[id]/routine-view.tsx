/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Input, SectionLabel } from "@/components/ui";
import {
  addRoutineSet,
  deleteRoutine,
  removeExerciseFromRoutine,
  removeRoutineSet,
  updateRoutineSet,
} from "../actions";
import { ExercisePicker } from "./exercise-picker";

type RoutineItem = {
  id: string; // routine_exercise id
  exerciseName: string;
  muscleGroup: string;
  mediaUrl: string | null;
  sets: { id: string; setNumber: number; suggestedReps: string | null }[];
};

type CatalogExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  mediaUrl: string | null;
};

/** Stepper táctil: botones grandes, sin teclado en pantalla. */
function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <span className="flex items-center bg-base">
      <button
        type="button"
        aria-label={`Menos ${label}`}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="px-3 py-1.5 text-ink-soft active:bg-surface-alt"
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-medium">{value}</span>
      <button
        type="button"
        aria-label={`Más ${label}`}
        onClick={() => onChange(Math.min(99, value + 1))}
        className="px-3 py-1.5 text-ink-soft active:bg-surface-alt"
      >
        +
      </button>
    </span>
  );
}

export function RoutineView({
  routineId,
  items,
  catalog,
}: {
  routineId: string;
  items: RoutineItem[];
  catalog: CatalogExercise[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Edición de reps de un set (uno a la vez): rango con steppers
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [repsMin, setRepsMin] = useState(8);
  const [repsMax, setRepsMax] = useState(12);

  function openRepsEditor(set: { id: string; suggestedReps: string | null }) {
    const m = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(set.suggestedReps?.trim() ?? "");
    const lo = m ? Number(m[1]) : 8;
    setRepsMin(lo);
    setRepsMax(m?.[2] ? Number(m[2]) : m ? lo : 12);
    setEditingSetId(set.id);
  }

  // min y max se empujan mutuamente para que el rango nunca se invierta
  const changeMin = (v: number) => {
    setRepsMin(v);
    if (v > repsMax) setRepsMax(v);
  };
  const changeMax = (v: number) => {
    setRepsMax(v);
    if (v < repsMin) setRepsMin(v);
  };

  const repsValue = repsMin === repsMax ? `${repsMin}` : `${repsMin}-${repsMax}`;

  return (
    <>
      {items.length === 0 && !editing && (
        <p className="bg-surface px-4 py-4 text-sm text-ink-muted">
          Esta rutina no tiene ejercicios. Toca Editar para añadirlos.
        </p>
      )}

      {items.map((item) => (
        <section key={item.id}>
          <div className="mt-4 flex items-center gap-3 bg-surface px-4 py-3">
            {item.mediaUrl && (
              <img
                src={item.mediaUrl}
                alt={`Ejecución de ${item.exerciseName}`}
                className="h-12 w-12 bg-white object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-accent">
                {item.exerciseName}
              </p>
              <p className="text-xs text-ink-muted">{item.muscleGroup}</p>
            </div>
            {editing && (
              <form action={removeExerciseFromRoutine}>
                <input type="hidden" name="routineId" value={routineId} />
                <input type="hidden" name="routineExerciseId" value={item.id} />
                <button className="px-1 text-ink-faint active:text-danger">
                  ✕
                </button>
              </form>
            )}
          </div>

          <div className="bg-surface px-4 py-2">
            {item.sets.length > 0 && (
              <div className="flex items-center py-1 text-[11px] font-medium uppercase tracking-widest text-ink-muted">
                <span className="w-12">Set</span>
                <span className="flex-1">Reps</span>
                {editing && <span className="w-8" />}
              </div>
            )}
            <ul>
              {item.sets.map((s) =>
                editing && editingSetId === s.id ? (
                  <li key={s.id} className="flex items-center gap-2 py-1.5">
                    <span className="w-12 text-sm text-ink-muted">
                      {s.setNumber}
                    </span>
                    <Stepper value={repsMin} onChange={changeMin} label="reps mínimas" />
                    <span className="text-ink-faint">–</span>
                    <Stepper value={repsMax} onChange={changeMax} label="reps máximas" />
                    <form
                      action={updateRoutineSet}
                      onSubmit={() => setEditingSetId(null)}
                      className="ml-auto"
                    >
                      <input type="hidden" name="routineId" value={routineId} />
                      <input
                        type="hidden"
                        name="routineExerciseId"
                        value={item.id}
                      />
                      <input type="hidden" name="setId" value={s.id} />
                      <input
                        type="hidden"
                        name="suggestedReps"
                        value={repsValue}
                      />
                      <button
                        aria-label="Guardar reps"
                        className="bg-accent px-3 py-1.5 text-sm font-medium text-white active:opacity-80"
                      >
                        ✓
                      </button>
                    </form>
                    <button
                      type="button"
                      aria-label="Cancelar"
                      onClick={() => setEditingSetId(null)}
                      className="px-1 text-ink-faint active:text-ink"
                    >
                      ✕
                    </button>
                  </li>
                ) : (
                <li key={s.id} className="flex items-center py-1.5 text-sm">
                  <span className="w-12 text-ink-muted">{s.setNumber}</span>
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => openRepsEditor(s)}
                      className="flex-1 text-left font-medium text-accent active:opacity-70"
                    >
                      {s.suggestedReps}
                    </button>
                  ) : (
                    <span className="flex-1 text-ink-soft">
                      {s.suggestedReps}
                    </span>
                  )}
                  {editing && (
                    <form action={removeRoutineSet} className="w-8 text-right">
                      <input type="hidden" name="routineId" value={routineId} />
                      <input
                        type="hidden"
                        name="routineExerciseId"
                        value={item.id}
                      />
                      <input type="hidden" name="setId" value={s.id} />
                      <button
                        aria-label={`Eliminar set ${s.setNumber}`}
                        className="px-2 text-ink-faint active:text-danger"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>

            {editing && (
              <form action={addRoutineSet} className="flex gap-2 py-2">
                <input type="hidden" name="routineId" value={routineId} />
                <input type="hidden" name="routineExerciseId" value={item.id} />
                <Input
                  name="suggestedReps"
                  placeholder="Reps sugeridas (ej. 8-12)"
                  className="min-w-0 flex-1 text-sm"
                />
                <button className="px-3 text-sm font-medium text-accent active:opacity-70">
                  + set
                </button>
              </form>
            )}
          </div>
        </section>
      ))}

      {editing && (
        <>
          <div className="px-4 pb-2 pt-6">
            <SectionLabel>Añadir ejercicio</SectionLabel>
          </div>
          <ExercisePicker routineId={routineId} catalog={catalog} />
        </>
      )}

      <div className="mt-6 pb-6">
        <button
          onClick={() => setEditing(!editing)}
          className="w-full bg-accent px-4 py-4 text-base font-medium text-white active:opacity-80"
        >
          {editing ? "Listo" : "Editar"}
        </button>

        {confirmingDelete ? (
          <div className="mt-2 bg-surface px-4 py-4">
            <p className="text-sm text-ink-soft">
              ¿Eliminar esta rutina? Esta acción no se puede deshacer.
            </p>
            <div className="mt-3 flex gap-2">
              <form action={deleteRoutine} className="flex-1">
                <input type="hidden" name="routineId" value={routineId} />
                <button className="w-full bg-danger px-4 py-3 font-medium text-white active:opacity-80">
                  Sí, eliminar
                </button>
              </form>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 bg-surface-alt px-4 py-3 font-medium text-ink-soft active:bg-base"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-2 w-full bg-surface px-4 py-4 text-base font-medium text-danger active:bg-surface-alt"
          >
            Eliminar rutina
          </button>
        )}
      </div>
    </>
  );
}
