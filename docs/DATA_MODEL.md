# Modelo de datos — v0.1 (borrador para revisión)

> Este es el corazón de la app. Si el modelo está bien, todo lo demás fluye.
> Lee con ojo crítico: ¿falta algo que quieras registrar? ¿sobra algo?

## Diagrama de relaciones (alto nivel)

```
User (auth)
  │
  ├──< Exercise            (catálogo: globales + personalizados del usuario)
  │
  ├──< Routine             (plantilla reutilizable: "Día de empuje")
  │       └──< RoutineExercise   (qué ejercicios y en qué orden tiene la plantilla)
  │
  └──< WorkoutSession      (un entrenamiento concreto en una fecha)
          └──< SessionExercise   (un ejercicio dentro de esa sesión)
                  └──< SetEntry  (una serie: peso, reps, RPE)
```

Leyenda: `──<` significa "uno a muchos".

## Entidades

### User
Proviene de la autenticación de Supabase (`auth.users`). No la creamos nosotros;
solo referenciamos su `id`. Todo lo demás cuelga de un `user_id`.

### Exercise — catálogo de ejercicios
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | text | "Press de banca con barra" |
| muscle_group | enum/text | Grupo principal (pecho, espalda, piernas…) — **buscable/agrupable** |
| secondary_muscles | text[] | Grupos secundarios (opcional) |
| equipment | text | barra, mancuerna, máquina, peso corporal… |
| media_url | text \| null | **Video/animación de ejecución** del ejercicio |
| media_type | enum \| null | video \| gif \| animation (cómo renderizarlo) |
| default_unit | enum | kg \| lb — unidad sugerida al registrar (el usuario la cambia por sesión) |
| is_custom | bool | true si lo creó un usuario |
| owner_id | uuid \| null | null = ejercicio global; si no, dueño del personalizado |

**Decidido:** se precarga un catálogo base, **agrupado y buscable por grupo muscular**,
y **cada ejercicio incluye un video/animación** de cómo ejecutarlo (`media_url`).
> Pendiente: de dónde provienen esos videos (ver "Decisiones abiertas" abajo).

### Routine — plantilla de entrenamiento
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | Dueño |
| name | text | "Día de empuje A" |
| description | text | Opcional |
| created_at | timestamp | |

### RoutineExercise — ejercicio dentro de una plantilla
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| routine_id | uuid | FK → Routine |
| exercise_id | uuid | FK → Exercise |
| order | int | Orden en la rutina |
| target_sets | int | Series objetivo (ej. 3) |
| target_reps | text | Reps objetivo (ej. "8-12") |
| notes | text | Opcional |

### WorkoutSession — un entrenamiento real
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | Dueño |
| routine_id | uuid \| null | Si partió de una plantilla |
| date | timestamp | Cuándo se hizo |
| notes | text | "Me sentí fuerte hoy" |
| duration_min | int \| null | Duración opcional |

### SessionExercise — un ejercicio dentro de una sesión
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| session_id | uuid | FK → WorkoutSession |
| exercise_id | uuid | FK → Exercise |
| order | int | Orden en la sesión |
| weight_unit | enum | **kg \| lb — la unidad se elige aquí: por ejercicio y por sesión.** Todas las series de este ejercicio en esta sesión usan esta unidad |

> **Decisión clave (tuya):** la unidad de peso NO es global ni por serie, sino
> **por ejercicio dentro de cada sesión**. Por eso vive en `SessionExercise`, no en
> `SetEntry` ni en `User`. Al registrar, se sugiere `Exercise.default_unit` y el
> usuario puede cambiarla para esa sesión.

### SetEntry — una serie (la unidad mínima del tracking)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| session_exercise_id | uuid | FK → SessionExercise |
| set_number | int | 1, 2, 3… |
| weight | numeric | Peso, en la unidad definida en `SessionExercise.weight_unit` |
| reps | int | Repeticiones realizadas |
| rpe | numeric \| null | Esfuerzo percibido 1–10 (opcional) |
| is_warmup | bool | Serie de calentamiento (no cuenta para PRs) |
| completed | bool | Marcada como hecha |
| rest_sec | int \| null | Descanso tras la serie (opcional) |

## Datos derivados (NO se almacenan, se calculan)
Estos no son tablas; se computan con consultas SQL sobre lo anterior:
- **PRs (records):** máximo peso, 1RM estimado (fórmula Epley), máximo volumen por ejercicio.
- **Volumen por grupo muscular:** suma de peso×reps agrupado por `muscle_group` y semana.
- **Progreso por ejercicio:** serie temporal de peso/volumen para los gráficos.

> Mantenerlos como *cálculos* (no tablas) evita inconsistencias. Si el rendimiento
> lo pidiera más adelante, se podrían materializar; no es necesario al inicio.

## Decisiones cerradas
1. **Unidades:** ✅ por ejercicio y por sesión (`SessionExercise.weight_unit`), con `Exercise.default_unit` como sugerencia.
2. **Catálogo base:** ✅ sí, precargado, agrupado/buscable por grupo muscular, con video/animación por ejercicio.
3. **RPE:** ✅ opcional.
4. **Tipo de entrenamiento:** ✅ solo fuerza al inicio; cardio se añade después (campos distancia/duración).

5. **Origen del catálogo y media:** ✅ **AscendAPI** (ex-ExerciseDB) — se importa
   vía script a la tabla `Exercise`. Ver ADR-007 en `DECISIONS.md`.
