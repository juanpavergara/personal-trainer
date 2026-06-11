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
- **Estado: ✅ aceptada por el usuario.**
- **Decisión:** la prescripción de pesos/sets/reps
  para la siguiente sesión se calcula con **algoritmos deterministas** (doble progresión,
  autorregulación por RPE, ajustes por objetivo del mesociclo). Una capa de IA (LLM)
  puede añadirse encima para explicar o ajustar la propuesta conversacionalmente.
- **Por qué:** una prescripción de cargas debe ser **consistente, testeable y auditable**
  — mismas entradas, misma salida. Las reglas son gratis, funcionan offline y no
  dependen de servicios externos. La IA pura sería no determinista y con costo por uso.
- **Alternativa descartada (como núcleo):** LLM decidiendo las cargas directamente.

## ADR-009 — Tipos de set: enum de 6 valores, fallo como RPE/RIR, fundamentado en evidencia
- **Decisión:** `set_type` ∈ {warmup, working, drop, rest_pause, myo_reps, amrap}.
  "Al fallo" NO es un tipo: se registra como RPE 10 / RIR 0 (el esfuerzo se puede
  ver como RPE o RIR, misma escala invertida). Superseries = agrupación estructural
  futura (`superset_group`), no tipo de set.
- **Por qué (literatura, jun 2026):**
  - Meta-análisis: drop sets, rest-pause y myo-reps producen hipertrofia similar a
    series tradicionales con volumen/esfuerzo igualados; su valor es eficiencia de
    tiempo → son tipos porque cambian cómo se computa el volumen, no categorías "mágicas".
  - La proximidad al fallo es un continuo con efecto modesto en hipertrofia y nulo en
    fuerza (Robinson 2024; Refalo 2024) → mejor dato como RPE/RIR que como etiqueta.
  - AMRAP es prescripción abierta: la mejor fuente para estimar 1RM y calibrar el
    motor de progresión.
- **Fuentes:** Sports Med Open 2023 (drop sets); meta-análisis de sistemas avanzados
  (PMC12922048); Refalo et al. 2024 (J Sports Sci); Robinson et al. 2024 (Sports Med).

## ADR-010 — Voz: transcripción (Whisper) + LLM, desde el inicio
- **Decisión:** el registro de series por voz y la planeación de rutinas por voz se
  construyen **desde el inicio** (must-have) con la ruta **transcripción + LLM**:
  el audio se transcribe (Whisper o servicio equivalente) y un LLM convierte el texto
  en datos estructurados (series con peso/reps/RPE, o rutinas completas).
- **Por qué:** el lenguaje natural libre ("lunes empuje: press banca 4 por 8, fondos
  al fallo…") exige interpretación semántica que la Web Speech API nativa no da; la
  ruta IA es robusta al ruido del gimnasio y sirve igual para ambos casos de uso.
- **Implicaciones:**
  - Requiere API keys de servicios de IA como variables de entorno (Vercel) y tiene
    un costo pequeño por uso.
  - La voz es una **capa sobre la app**: todo debe poder hacerse también a mano.
    El LLM devuelve una propuesta estructurada que el usuario **confirma en pantalla**
    antes de guardarse (nunca escribe a la BD sin confirmación).
  - Proveedor/modelo exacto de STT y de parsing: se elige al implementar, verificando
    precios y disponibilidad del momento.
- **Alternativa descartada:** Web Speech API nativa como ruta principal (calidad
  irregular entre navegadores y con ruido; insuficiente para rutinas complejas).

---
## Decisiones de producto cerradas (ver DATA_MODEL.md)
- ✅ Unidad de peso: por ejercicio y por sesión.
- ✅ Catálogo base precargado, buscable/agrupado por grupo muscular, con video/animación (AscendAPI).
- ✅ RPE opcional.
- ✅ Solo fuerza al inicio; cardio después.
- ✅ Mesociclos: bloques con nombre, fechas y objetivo.
- ✅ Volumen por grupo muscular: por sesión, por mesociclo y libre en el tiempo.
- ✅ PRs (peso máx. y volumen máx.) como historial por ejercicio.
- ✅ Tipos de set confirmados: warmup, working, drop, rest_pause, myo_reps, amrap (ADR-009).
- ✅ Esfuerzo registrable como RPE o RIR; fallo = RPE 10 / RIR 0.

- ✅ Voz desde el inicio, ruta Whisper + LLM (ADR-010).
- ✅ Motor de progresión: reglas + capa IA opcional (ADR-008, aceptada).

## Pendiente de decidir
- (nada — documentación de fase 0 cerrada; lo que surja se añade aquí)
