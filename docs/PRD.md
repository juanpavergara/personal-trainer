# PRD — App de tracking de rutinas de gimnasio

> Borrador inicial v0.1 — para revisión. Lo que no esté claro o sobre, lo ajustamos.

## 1. Visión
Una aplicación web (PWA, instalable en el móvil) para registrar y analizar entrenamientos
de fuerza en el gimnasio. Pensada para usarse **de pie, entre series**: rápida, pocos toques,
funciona aunque la señal sea mala.

## 2. Para quién
- **Usuario principal:** el propietario (tú).
- **Usuarios secundarios:** un grupo pequeño y conocido (amigos / clientes).
- Cada usuario ve **solo sus propios datos**. Requiere cuenta y login.

## 3. Problema que resuelve
Llevar el registro en papel o notas sueltas hace imposible ver el progreso real
(¿estoy levantando más que hace un mes?, ¿cuál es mi récord en press de banca?,
¿estoy descuidando algún grupo muscular?). Esta app convierte cada entrenamiento
en datos que muestran progreso de forma automática.

## 4. Features priorizadas

### Must-have (MVP usable desde el día 1)
- [ ] Registro/login de usuario (cada quien sus datos).
- [ ] Catálogo de ejercicios **agrupado y buscable por grupo muscular**, con
      **video/animación de ejecución** por ejercicio (predefinidos + crear personalizados).
- [ ] Registrar una sesión de entrenamiento: añadir ejercicios y, por cada uno,
      series con **peso, repeticiones y RPE (opcional)**. La **unidad (kg/lb) se elige
      por ejercicio en cada sesión**.
- [ ] Historial por ejercicio: ver todas las series pasadas de un ejercicio.
- [ ] Marcar series como completadas durante la sesión.

### Should-have (lo que hace la app "completa")
- [ ] **Rutinas / plantillas** reutilizables (ej. "Día de empuje") que precargan ejercicios.
- [ ] Notas por sesión y por ejercicio; tiempo de descanso.
- [ ] **Gráficos de progreso** por ejercicio (peso/volumen en el tiempo).
- [ ] **Records personales (PRs):** mejor peso, mejor 1RM estimado, mejor volumen.
- [ ] **Volumen por grupo muscular** (cuánto trabajas cada grupo por semana).

### Nice-to-have (más adelante)
- [ ] Planificación semanal / calendario de entrenamientos.
- [ ] Temporizador de descanso integrado.
- [ ] Exportar datos (CSV).
- [ ] Modo offline completo (registrar sin señal y sincronizar después).

## 5. Fuera de alcance (por ahora)
- App nativa en tiendas (iOS/Android). El backend elegido permite migrar a esto luego.
- Red social / compartir entrenamientos públicamente.
- Nutrición / dieta.

## 6. Principios de diseño
1. **Velocidad sobre todo:** registrar una serie debe ser cuestión de 2-3 toques.
2. **Móvil primero:** todo se diseña para una mano y pantalla pequeña.
3. **Los datos son tuyos:** privacidad por defecto, exportables.
4. **Iterar en vertical:** cada feature se construye completa y se prueba en una URL real
   antes de pasar a la siguiente.
