# Spec funcional: Rutina

> Estado: **APROBADA** (2026-06-11) — lista para implementar.

## Qué es una rutina
Una **plantilla de ejercicios** con nombre. Cada ejercicio tiene **sets**, y cada
set tiene **reps sugeridas**. Es un plan reutilizable, no un registro de realidad.

## Estructura
- **Nombre** (obligatorio).
- **Lista ordenada de ejercicios**; por cada ejercicio, una lista de **sets**;
  por cada set, **reps sugeridas**.
  - ⚠️ Esto exige granularidad por set en la plantilla. El modelo actual
    (`RoutineExercise.target_sets` + `target_reps`) se queda corto → se necesita
    una entidad de set de plantilla (p. ej. `RoutineSet`). Se ajustará en
    `DATA_MODEL.md` al aprobar esta spec.
- **Target de volumen por grupo muscular:** la rutina expone cuánto volumen
  añadirá a cada grupo muscular, medido en **sets efectivos por grupo**
  (no cuentan warmups; es el estándar de la literatura para dosificar volumen).
- **Grupos musculares visibles:** la rutina muestra qué grupos targetean sus
  ejercicios, con las **figuras provenientes de ExerciseDB/AscendAPI** (ADR-007).

## Reps sugeridas inteligentes
Cuando existe historial del usuario en un ejercicio, las reps sugeridas no son
fijas: las propone el **motor de progresión** (ADR-008) según el **objetivo de la
sesión**:
- **Ganar** → carga progresiva (subir estímulo sesión a sesión).
- **Mantener** → mantener carga y **reducir volumen**. Para soportarlo se añade
  **`maintenance` (mantenimiento)** al enum de objetivos de mesociclo/sesión.
Sin historial, se usan las reps escritas en la plantilla.

**La plantilla solo guarda reps sugeridas, nunca peso.** El peso lo propone
siempre el motor según el historial (vacío si no hay historial). Así las
plantillas no envejecen con pesos obsoletos.

## El sistema como entrenador: metas de volumen
El target de volumen **no lo fija el usuario a mano ni es solo informativo**:
**el sistema lo prescribe**, como lo haría un entrenador — *"esta es tu meta de
volumen para este grupo muscular en esta sesión"*. El usuario debe poder ver:
- la **meta de volumen por grupo muscular de cada sesión**, y
- la **meta semanal**, para monitorear su progreso en volumen contra ella.
La prescripción sale del motor de progresión según el objetivo del
mesociclo/sesión y el historial del usuario.

## Relación con mesociclos
- Una rutina **puede pertenecer a un mesociclo o no**.
- Quien entrena con mesos: el meso tiene sus rutinas.
- Quien no: hace sesiones desde una rutina suelta, o **sesiones en blanco**
  (sin rutina) — ambos caminos siguen existiendo.

## Sesión iniciada desde una rutina
- Se **precarga la plantilla completa**: todos los ejercicios con sus sets y
  reps/pesos sugeridos.
- El usuario va registrando, por cada set, **cuántas reps hizo y con qué peso**.
- Durante la sesión el usuario puede **añadir ejercicios, reemplazar ejercicios,
  y añadir o quitar sets** — la rutina no es una camisa de fuerza.

## Semántica de snapshot (regla de oro)
**Una sesión es un snapshot de lo que efectivamente pasó en la realidad**,
independiente de qué plantilla salió o de si no salió de ninguna.
- Al iniciar sesión desde rutina, la plantilla se **copia**, no se referencia.
- **Editar una rutina no afecta jamás a las sesiones pasadas** derivadas de ella.
- (El modelo actual ya cumple esto: `session_exercises`/`set_entries` son
  independientes; `workout_sessions.routine_id` queda solo como referencia
  informativa de origen.)

## Creación de rutinas
1. **Manual:** escoger cada ejercicio, añadir sets y reps.
2. **Por voz** (ADR-010), en dos niveles de inteligencia:
   - **Dictado detallado:** el usuario dice ejercicios, sets, pesos y reps.
   - **Generación por objetivo:** el usuario describe en lenguaje natural qué
     rutina quiere y con qué objetivo, **sin especificar ejercicios/sets/pesos/reps**,
     y el sistema **sugiere los ejercicios** y la estructura completa.
   - En ambos casos aplica la regla de ADR-010: el resultado se **confirma en
     pantalla** antes de guardarse.

---

## Implicaciones para el modelo de datos (al aprobar)
1. Nueva entidad **`RoutineSet`** (sets por ejercicio de plantilla, con reps
   sugeridas); `RoutineExercise.target_sets/target_reps` se reemplazan.
2. `routines.mesocycle_id` **nullable** (rutina con o sin mesociclo).
3. Enum `training_objective` += **`maintenance`**.
4. Las metas de volumen prescritas son **calculadas por el motor** (no tablas
   nuevas por ahora); si se materializan, se decide al implementar el motor.
5. Figuras de grupo muscular → vienen del import de ExerciseDB/AscendAPI (ADR-007).
