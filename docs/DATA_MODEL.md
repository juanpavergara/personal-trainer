# Modelo de datos — v0.1 (borrador para revisión)

> Este es el corazón de la app. Si el modelo está bien, todo lo demás fluye.
> Lee con ojo crítico: ¿falta algo que quieras registrar? ¿sobra algo?

## Diagrama de relaciones (alto nivel)

```
User (auth)
  │
  ├──< Exercise            (catálogo: globales + personalizados del usuario)
  │
  ├──< Mesocycle           (bloque de entrenamiento: fechas + objetivo)
  │       │
  ├──< Routine             (plantilla reutilizable: "Día de empuje")
  │       └──< RoutineExercise   (qué ejercicios y en qué orden tiene la plantilla)
  │       │
  └──< WorkoutSession      (un entrenamiento concreto en una fecha; pertenece
          │                 opcionalmente a un Mesocycle)
          └──< SessionExercise   (un ejercicio dentro de esa sesión)
                  └──< SetEntry  (una serie: peso, reps, RPE, tipo de set)
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

### Mesocycle — bloque de entrenamiento con fechas y objetivo
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | Dueño |
| name | text | "Bloque hipertrofia Q3" |
| objective | enum | hipertrofia \| fuerza \| estrés_metabólico \| descarga \| otro |
| start_date | date | Inicio del bloque |
| end_date | date | Fin del bloque |
| notes | text | Opcional |

> El objetivo del mesociclo **condiciona el motor de progresión**: qué pesos/sets/reps
> se proponen para la siguiente sesión depende de si el bloque busca fuerza,
> hipertrofia o estrés metabólico. El análisis de volumen funciona en dos modos:
> **por mesociclo** (sesiones del bloque) y **libre en el tiempo** (sin bloque).

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
| mesocycle_id | uuid \| null | Bloque al que pertenece (null = entrenamiento libre) |
| session_type | enum \| null | fuerza \| hipertrofia \| estrés_metabólico \| descarga — hereda del mesociclo por defecto, se puede cambiar por sesión |
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
| rpe | numeric \| null | Esfuerzo percibido 1–10, opcional. Se puede registrar/mostrar también como **RIR** (reps en reserva): RIR = 10 − RPE. RPE 10 / RIR 0 = al fallo |
| set_type | enum | **Confirmado:** warmup \| working \| drop \| rest_pause \| myo_reps \| amrap. Default: `working` |
| completed | bool | Marcada como hecha |
| rest_sec | int \| null | Descanso tras la serie (opcional) |

> **Diseño del `set_type` (fundamentado en literatura — ver ADR-009):**
> - `warmup` se excluye de volumen efectivo y PRs.
> - `drop`, `rest_pause`, `myo_reps`: técnicas de eficiencia; sus sub-series cuentan
>   para el volumen.
> - `amrap`: prescripción abierta (máximas reps posibles); fuente principal para
>   estimar 1RM en el motor de progresión.
> - **"Al fallo" NO es un tipo de set:** se captura con RPE 10 / RIR 0 — la evidencia
>   trata la proximidad al fallo como continuo, no como etiqueta binaria.
> - **Superseries NO son tipo de set:** son agrupación estructural entre ejercicios;
>   cuando se necesiten, será un campo `superset_group` en `SessionExercise`.

## Datos derivados (NO se almacenan, se calculan)
Estos no son tablas; se computan con consultas SQL sobre lo anterior:
- **PRs (records), como historial por ejercicio:** máximo peso y máximo volumen por
  ejercicio, presentados como línea de tiempo (cuándo se rompió cada récord), además
  del 1RM estimado (fórmula Epley). Solo cuentan sets efectivos (no warmup).
- **Volumen por grupo muscular:** suma de peso×reps agrupado por `muscle_group`, en
  tres vistas: **por sesión**, **por mesociclo** y **libre en el tiempo** (semana/mes).
- **Progreso por ejercicio:** serie temporal de peso/volumen para los gráficos.

> Mantenerlos como *cálculos* (no tablas) evita inconsistencias. Si el rendimiento
> lo pidiera más adelante, se podrían materializar; no es necesario al inicio.
> Nota: con unidades mixtas (kg/lb por ejercicio-sesión), los agregados normalizan
> todo a una unidad antes de sumar.

## Motor de progresión (prescripción de la siguiente sesión)
La app analiza los resultados sesión tras sesión y **propone pesos, sets y reps para
la siguiente**, según el objetivo del mesociclo/sesión:
- **Entrada:** historial de `SetEntry` del ejercicio (peso, reps, RPE, tipo de set),
  `session_type` y `Mesocycle.objective`.
- **Salida:** prescripción por ejercicio (peso sugerido, sets × reps objetivo, descanso).
- **Lógica según objetivo (ejemplos):** fuerza → subir peso, bajar reps; hipertrofia →
  doble progresión (reps primero, luego peso); estrés metabólico → más volumen,
  descansos cortos, drop sets; descarga → reducir carga/volumen.
- La prescripción se calcula (no se almacena como verdad), pero **se guarda la
  propuesta junto a lo realmente ejecutado** para poder comparar plan vs. realidad
  y mejorar las reglas. Tabla futura: `Prescription` (se diseña al construir la feature).

Ver ADR-008 en `DECISIONS.md` para la decisión motor de reglas vs. IA.

## Decisiones cerradas
1. **Unidades:** ✅ por ejercicio y por sesión (`SessionExercise.weight_unit`), con `Exercise.default_unit` como sugerencia.
2. **Catálogo base:** ✅ sí, precargado, agrupado/buscable por grupo muscular, con video/animación por ejercicio.
3. **RPE:** ✅ opcional.
4. **Tipo de entrenamiento:** ✅ solo fuerza al inicio; cardio se añade después (campos distancia/duración).

5. **Origen del catálogo y media:** ✅ **AscendAPI** (ex-ExerciseDB) — se importa
   vía script a la tabla `Exercise`. Ver ADR-007 en `DECISIONS.md`.
6. **Mesociclos:** ✅ bloques con nombre, fechas y objetivo (entidad `Mesocycle`);
   las sesiones pertenecen opcionalmente a un bloque.
7. **Tipos de set:** ✅ confirmados: warmup, working, drop, rest_pause, myo_reps,
   amrap. "Al fallo" se captura vía RPE/RIR, no como tipo (ADR-009).

8. **Voz:** ✅ desde el inicio, ruta Whisper + LLM (ADR-010). El LLM produce datos
   que el usuario confirma en pantalla antes de guardar — no escribe a la BD directo.
9. **Motor de progresión:** ✅ reglas deterministas + capa IA opcional (ADR-008).

*No quedan decisiones abiertas de fase 0.*
