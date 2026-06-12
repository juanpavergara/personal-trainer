<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Memoria operativa del proyecto

Este archivo se carga automáticamente en cada sesión (vía `CLAUDE.md` → `@AGENTS.md`).
Mantenerlo corto y actualizado.

## Qué es esto
App de tracking de rutinas de gimnasio. PWA móvil (instalable desde el browser,
se usa como app), multiusuario (cada quien sus datos). Tracking completo: series con
peso/reps/RPE/tipo de set, mesociclos (bloques con objetivo), volumen por grupo
muscular (sesión/mesociclo/tiempo), PRs como historial, y un **motor de progresión**
que propone cargas para la siguiente sesión. Registro y planeación de rutinas **por voz**
(Whisper + LLM) desde el inicio. Detalle en `docs/PRD.md`.

## Stack (ver `docs/DECISIONS.md` para el porqué)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind, como PWA.
- **Backend/BD/Auth:** Supabase (Postgres + Auth + RLS).
- **ORM/migraciones:** Drizzle.
- **Gráficos:** Recharts (tentativo).
- **Catálogo de ejercicios + media:** AscendAPI (ex-ExerciseDB), importado por script.
- **Hosting:** Vercel (deploy automático por push; preview por rama).
- **Repo:** https://github.com/juanpavergara/personal-trainer
- **URL producción:** https://personal-trainer-ashen.vercel.app

## Decisiones de producto fijadas
- Unidad de peso: por ejercicio y por sesión (`SessionExercise.weight_unit`).
- Catálogo precargado, buscable/agrupado por grupo muscular, con video/animación.
- RPE opcional. Solo fuerza al inicio (cardio después).
- Mesociclos = bloques con nombre, fechas y objetivo; condicionan el motor de progresión.
- Motor de progresión: reglas deterministas como núcleo, IA opcional encima (ADR-008 ✅).
- Voz desde el inicio, ruta Whisper + LLM; siempre con confirmación en pantalla (ADR-010).
- Tipos de set: warmup, working, drop, rest_pause, myo_reps, amrap. Fallo = RPE 10/RIR 0,
  no es tipo de set (ADR-009).

## Documentación clave
- `docs/PRD.md` — visión y features priorizadas.
- `docs/DATA_MODEL.md` — entidades y relaciones (el corazón de la app).
- `docs/DECISIONS.md` — decisiones técnicas con su porqué.

## Forma de trabajar
1. **Plan antes de código:** diseñar y aprobar antes de implementar cambios grandes.
2. **Rebanadas verticales:** construir cada feature completa y verificarla en una URL
   real (preview de Vercel) antes de pasar a la siguiente.
3. **Commits pequeños** por feature, con mensajes claros.
4. **El modelo de datos manda:** cambios al esquema → migración Drizzle versionada.

## Comandos clave
- Instalar: `npm install`
- Desarrollo local: `npm run dev`
- Build (verificación): `npm run build`
- Lint: `npm run lint`
- Migraciones: `npx drizzle-kit generate` → `npx drizzle-kit migrate`
- Seed catálogo provisional: `node scripts/seed-exercises.mjs` (idempotente)
- Desplegar: automático al hacer push a la rama (Vercel).

## Auth
- Supabase Auth email+password vía `@supabase/ssr`. Clientes en `src/lib/supabase/`,
  protección de rutas en `src/proxy.ts` (Next 16 renombró middleware → proxy).
- La publishable key (`sb_publishable_*`) es la "anon key" moderna; va en
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- ⚠️ La validación de emails de Supabase rechaza direcciones "de prueba"
  (email_address_invalid) y el email service del free tier tiene rate limit bajo.
- Autorización de datos: en código de servidor, TODA query filtra por `user_id`
  del usuario autenticado (RLS está en deny-all; no confiar solo en él).

## Base de datos
- Supabase proyecto `nipfjvyircdktpwgoiux` (us-west-2). Credenciales en `.env.local`
  (NUNCA commitearlas; plantilla en `.env.example`).
- Conexión vía pooler `aws-1-us-west-2.pooler.supabase.com`: app en transaction mode
  (puerto 6543, `prepare:false`), migraciones en session mode (5432). El host directo
  `db.*.supabase.co` es IPv6-only y esta red no tiene IPv6.
- Esquema en `src/db/schema.ts`; migraciones versionadas en `drizzle/`.
  Aplicar: `npx drizzle-kit generate` → `npx drizzle-kit migrate`.
- Las 7 tablas tienen **RLS activado sin políticas** (deny-all vía PostgREST):
  el acceso a datos va por el servidor Next (Drizzle). Si se crean políticas RLS,
  documentar el porqué.

## Estado actual
- [x] Documentación de fase 0 COMPLETA (PRD, modelo de datos, 10 ADRs). Sin decisiones abiertas.
- [x] Repo GitHub conectado: juanpavergara/personal-trainer (HTTPS vía gh).
- [x] Esqueleto Next.js (TS + Tailwind, App Router, src/).
- [x] Supabase conectado; esquema completo (7 tablas + 4 enums) migrado y verificado.
- [x] Vercel desplegado y verificado: https://personal-trainer-ashen.vercel.app
- [x] Auth (login/signup/logout) con Supabase + protección de rutas (verificado local).
- [x] Primera rebanada vertical CONSTRUIDA: dashboard → nueva sesión → añadir
      ejercicio (unidad kg/lb por ejercicio-sesión) → registrar series (tipo de set,
      RPE) → historial por ejercicio. Catálogo provisional sembrado (21 ejercicios).
- [ ] Usuario: (1) cargar en Vercel las env vars de `.env.local` (DATABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) y redeploy;
      (2) en Supabase desactivar "Confirm email" (Auth → Sign In / Up) o configurar
      Site URL + plantilla con token_hash. **Requiere acción del usuario.**
- [ ] Verificar la rebanada en producción (login real + registrar serie en el móvil).
- [x] Rutinas Fase A (modelo: routine_sets, mesocycle_id, maintenance) — migrado.
- [x] Rutinas Fase B (CRUD): crear/listar/editar/eliminar rutinas, sets con reps
      sugeridas, volumen de plantilla (sets por grupo muscular), GIFs si hay media.
- [x] Rutinas UX: lista con resumen (volumen por grupo + ejercicios); detalle con
      modos ver/editar en la misma ruta (CTAs al fondo, eliminar con confirmación
      inline); buscador de ejercicios con filtro por grupo muscular; reps por rango
      editables con steppers; trash can para borrar sets.
- [x] Media del seed provisional: los 21 ejercicios sembrados tienen imagen estática
      de free-exercise-db (`scripts/fill-missing-media.mjs`, idempotente). El enum
      `media_type` ahora incluye `image` (migración 0003).
- [ ] Rutinas Fase C: iniciar sesión desde rutina (snapshot completo) + desvíos.
- [ ] Catálogo completo: AscendAPI free = demo de 25 ej. (cursor circular, search
      deshabilitado; verificado). RapidAPI solo tiene planes de pago (usuario
      verificó). DECISIÓN PENDIENTE: pagar vs. dataset open source
      (yuhonas/free-exercise-db, ~870 ej., MIT, imágenes estáticas).
- [ ] Capa de voz (registro de series y planeación de rutinas). Necesita API key STT/LLM.
- [ ] Mesociclos UI, volumen por grupo muscular (analytics), PRs, motor de progresión.
- [ ] Deuda: latencia alta de la app (BD en us-west-2 + sin UI optimista) — optimizar.
