# CLAUDE.md — memoria operativa del proyecto

Este archivo se carga automáticamente en cada sesión. Mantiene a Claude orientado.
Mantenerlo corto y actualizado.

## Qué es esto
App de tracking de rutinas de gimnasio. PWA móvil, multiusuario (cada quien sus datos),
tracking completo (series con peso/reps/RPE, rutinas, gráficos de progreso, PRs,
volumen por grupo muscular). Detalle en `docs/PRD.md`.

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
- [x] Documentación inicial (PRD, modelo de datos, decisiones).
- [x] Decisiones de producto cerradas (unidades, catálogo+media, RPE, alcance).
- [ ] Crear cuentas: GitHub (repo), Supabase (proyecto), Vercel. **Requiere acción del usuario.**
- [ ] Esqueleto Next.js + Supabase + primera URL desplegada.
- [ ] Script de importación del catálogo desde AscendAPI.
- [ ] Primera rebanada vertical: registrar una serie y verla en historial.
