# Decisiones técnicas (ADR ligero)

> Una línea de contexto + la decisión + el porqué. Cuando una decisión cambie,
> no se borra: se marca como "Reemplazada por…" para conservar el historial.

## ADR-001 — Tipo de aplicación: PWA web móvil
- **Decisión:** Web app instalable (PWA), optimizada para móvil.
- **Por qué:** Se usa en el gimnasio desde el móvil; la PWA da experiencia tipo app
  sin pasar por tiendas, y permite iterar y desplegar al instante.
- **Alternativa descartada:** App nativa (más fricción de build/despliegue al inicio).
  El backend elegido permite migrar a nativa luego sin rehacer datos.

## ADR-002 — Framework frontend: Next.js (App Router) + TypeScript
- **Decisión:** Next.js con App Router y TypeScript.
- **Por qué:** PWA-capable, "server actions" para hablar con la BD sin API REST aparte,
  y despliegue nativo en Vercel. Ecosistema grande (gráficos, componentes).
- **Alternativas descartadas:** Vite+React (requiere montar backend aparte);
  SvelteKit (ecosistema de librerías más pequeño).

## ADR-003 — Backend, base de datos y auth: Supabase (Postgres)
- **Decisión:** Supabase para base de datos (Postgres), autenticación y seguridad por filas (RLS).
- **Por qué:** El tracking es analítico (progreso, PRs, volumen) → encaja una BD **relacional**.
  Supabase aporta Postgres gestionado + login listo + aislamiento de datos por usuario,
  sin operar infraestructura. Open source → self-host posible si hiciera falta.
- **Alternativa descartada:** Firebase (NoSQL, peor para consultas relacionales/analíticas);
  backend propio (más mantenimiento, contrario a "iterar fácil").

## ADR-004 — Acceso a datos: Drizzle ORM
- **Decisión:** Drizzle ORM con migraciones versionadas.
- **Por qué:** Ligero, rápido en entornos serverless (Vercel), sintaxis SQL tipada.
  Migraciones versionadas permiten evolucionar el modelo sin romper datos.
- **Alternativa descartada:** Prisma (más pesado para serverless).

## ADR-005 — Hosting y despliegue: Vercel + GitHub
- **Decisión:** Repositorio en GitHub conectado a Vercel.
- **Por qué:** Cada `push` despliega automáticamente; cada rama obtiene una URL de
  preview propia → se prueba en el móvil sin entorno local. Plan gratuito suficiente.
- **Alternativa descartada:** Self-host/Docker (más control, pero más trabajo operativo;
  posible más adelante por ser todo open source).

## ADR-006 — Gráficos: Recharts
- **Decisión:** Recharts para visualizaciones de progreso.
- **Por qué:** Integración sencilla con React, suficiente para series temporales y barras.
- **Estado:** Tentativa; se confirma al construir la pantalla de progreso.

## ADR-007 — Catálogo y media: AscendAPI (ex-ExerciseDB)
- **Decisión:** Sembrar el catálogo de ejercicios (nombres, grupo muscular y
  animaciones de ejecución) desde **AscendAPI**, sucesor de ExerciseDB.
- **Por qué:** Aporta de una sola fuente ~1.300 ejercicios con animación y grupo
  muscular → catálogo rico y con media desde el día 1, sin producir media propia.
- **Cómo:** Un script de importación que vuelca los datos a la tabla `Exercise`
  (`media_url`, `media_type`, `muscle_group`). Los usuarios pueden añadir ejercicios
  personalizados encima.
- **Abierto a futuro:** Complementar con enlaces de YouTube o media propia en
  Supabase Storage sin cambiar el modelo (`media_url`/`media_type` ya lo soportan).
- **A confirmar al implementar:** endpoint exacto, autenticación (API key) y términos
  de uso de AscendAPI.

## ADR-008 — Motor de progresión: reglas deterministas como núcleo, IA como capa opcional
- **Decisión (tentativa, a validar con el usuario):** la prescripción de pesos/sets/reps
  para la siguiente sesión se calcula con **algoritmos deterministas** (doble progresión,
  autorregulación por RPE, ajustes por objetivo del mesociclo). Una capa de IA (LLM)
  puede añadirse encima para explicar o ajustar la propuesta conversacionalmente.
- **Por qué:** una prescripción de cargas debe ser **consistente, testeable y auditable**
  — mismas entradas, misma salida. Las reglas son gratis, funcionan offline y no
  dependen de servicios externos. La IA pura sería no determinista y con costo por uso.
- **Alternativa descartada (como núcleo):** LLM decidiendo las cargas directamente.

---
## Decisiones de producto cerradas (ver DATA_MODEL.md)
- ✅ Unidad de peso: por ejercicio y por sesión.
- ✅ Catálogo base precargado, buscable/agrupado por grupo muscular, con video/animación (AscendAPI).
- ✅ RPE opcional.
- ✅ Solo fuerza al inicio; cardio después.
- ✅ Mesociclos: bloques con nombre, fechas y objetivo.
- ✅ Volumen por grupo muscular: por sesión, por mesociclo y libre en el tiempo.
- ✅ PRs (peso máx. y volumen máx.) como historial por ejercicio.
- ✅ Tipos de set múltiples (`set_type`).

## Pendiente de decidir
- Lista definitiva de **tipos de set** (propuestos: warmup, working, drop, failure,
  amrap, myo_reps, rest_pause).
- **Ruta técnica de la voz** (registro y planeación de rutinas): Web Speech API
  nativa vs. transcripción + LLM vs. híbrido, y su prioridad.
- Validar ADR-008 (motor de reglas + capa IA opcional) con el usuario.
