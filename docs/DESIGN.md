# Design language — "D1 · Azul sutil"

> Estado: APROBADO por el usuario (2026-06-11). Toda pantalla nueva consume estos
> tokens; no se inventan colores ni estilos por fuera de este doc.

## Principios (el brief del usuario)
1. **Light siempre.** Sin modo oscuro, sin contraste negro/blanco. La app fija
   `color-scheme: light` e ignora el modo del sistema.
2. **Los bordes no existen.** Nada de `border`. La estructura se construye con
   **cambio de tono** entre bloques.
3. **Sin esquinas redondeadas.** `border-radius: 0` en todo.
4. **Sin márgenes entre bloques.** Las secciones son full-width y se apilan
   tocándose. El espacio vive *dentro* de los bloques (padding), nunca entre ellos.
5. **Minimalista.** Un solo color de acento. Jerarquía por tipografía y tono,
   no por decoración.

## Tokens de color
| Token | Hex | Uso |
|-------|-----|-----|
| `base` | `#F4F7FA` | Fondo de página (bruma azulada) |
| `surface` | `#FFFFFF` | Bloques de contenido |
| `surface-alt` | `#EBF1F6` | Bloques alternos (cabeceras de ítem, énfasis suave) |
| `ink` | `#18222A` | Texto principal |
| `ink-soft` | `#44525E` | Texto secundario (datos, valores) |
| `ink-muted` | `#7C8B97` | Etiquetas, metadatos |
| `ink-faint` | `#93A1AC` | Placeholders |
| `accent` | `#0F6E56` | Verde profundo: botón primario, números clave, links de acción |
| `danger` | `#A32D2D` | Acciones destructivas (solo texto, nunca fondos llamativos) |

## Patrones de componente
- **Bloque:** sección full-width con `px-4 py-3` interno. Alterna `surface` /
  `surface-alt` / `base` para separarse de sus vecinos. Jamás borde ni sombra.
- **Botón primario:** bloque `accent` con texto blanco, esquinas rectas.
- **Botón secundario:** texto `accent` sobre el tono del bloque (sin caja).
- **Input/Select:** fondo `base` (bruma) cuando está sobre `surface`; texto `ink`
  explícito SIEMPRE (el bug histórico: heredar color del sistema). Foco: el fondo
  pasa a `surface-alt`; sin anillos ni bordes.
- **Etiquetas de sección:** 11-12px, mayúsculas con tracking, `ink-muted`.
- **Números clave (volumen, PRs):** `accent`, peso 600.
- **Media (GIFs):** cuadrados, sin marco, fondo blanco.

## Implementación
- Tokens definidos UNA vez en `src/app/globals.css` (`@theme` de Tailwind v4)
  → clases `bg-base`, `text-ink`, `bg-accent`, etc.
- Primitivos reutilizables en `src/components/ui.tsx` (`Input`, `Select`,
  `PrimaryButton`): toda pantalla los usa en lugar de repetir clases.
- Cambiar el look global = tocar `globals.css`, no las pantallas.
