# CLAUDE.md — memoria operativa del proyecto

Este archivo se carga automáticamente en cada sesión. Mantiene a Claude orientado.
Mantenerlo corto y actualizado.

## Qué es esto
App de tracking de rutinas de gimnasio. PWA móvil (instalable desde el browser,
se usa como app), multiusuario (cada quien sus datos). Tracking completo: series con
peso/reps/RPE/tipo de set, mesociclos (bloques con objetivo), volumen por grupo
muscular (sesión/mesociclo/tiempo), PRs como historial, y un **motor de progresión**
que propone cargas para la siguiente sesión. Registro y planeación de rutinas **por voz**
(Whisper + LLM) desde el inicio. Detalle en `docs/PRD.md`.

## Stack (ver `docs/DECISIONS.md` para el porqué)
- **Frontend:** Next.js (App Router) + TypeScript, como PWA.
- **Backend/BD/Auth:** Supabase (Postgres + Auth + RLS).
- **ORM/migraciones:** Drizzle.
- **Gráficos:** Recharts (tentativo).
- **Catálogo de ejercicios + media:** AscendAPI (ex-ExerciseDB), importado por script.
- **Hosting:** Vercel (deploy automático por push; preview por rama).

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
> Se completan cuando se cree el esqueleto del proyecto.
- Instalar: `pnpm install` (TBD)
- Desarrollo local: `pnpm dev` (TBD)
- Migraciones: `pnpm drizzle-kit ...` (TBD)
- Desplegar: automático al hacer push a la rama (Vercel).

## Estado actual
- [x] Documentación de fase 0 COMPLETA (PRD, modelo de datos, 10 ADRs). Sin decisiones abiertas.
- [ ] Crear cuentas: GitHub (repo), Supabase (proyecto), Vercel. **Requiere acción del usuario.**
      Para la voz se necesitará además una API key de STT/LLM (al implementar esa capa).
- [ ] Esqueleto Next.js + Supabase + primera URL desplegada.
- [ ] Script de importación del catálogo desde AscendAPI.
- [ ] Primera rebanada vertical: registrar una serie y verla en historial.
- [ ] Capa de voz (registro de series y planeación de rutinas).
