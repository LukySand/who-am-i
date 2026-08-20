# Roadmap

- [x] **Fase 1 — Pipeline.** Scaffold Vite+React+TS, build verde, docs.
- [x] **Fase 1b — GitHub.** Pusheado a `LukySand/who-am-i`. Falta Vercel + `db push` (necesitan tus credenciales).
- [x] **Fase 2 — Base de datos.** Migraciones, RLS, RPCs, generador de códigos, 6 plantillas de fábrica (3 × 2 idiomas). Tests de las tres modalidades + test de RLS con rol `authenticated`.
- [x] **Fase 3 — Auth y lobby.** Magic link, Google, sesión anónima. Home, crear partida, unirse por código, nombre + emoji, lobby en vivo por Realtime. Verificado en navegador contra la base local.
- [x] **Fase 4 — Plantillas.** Creador con campos obligatorios/opcionales/multivalor, timer en la plantilla, compartir. Partida Rápida (plantilla descartable). Formulario de ficha integrado al flujo de partida. Verificado en navegador, incluido el login por magic link.
- [x] **Fase 5 — Motor + Relámpago.** Máquina de estados, revelación automática cada 2,5s, timer contra el reloj del servidor, controles del host, resultado de ronda y podio con posiciones compartidas. Partida completa de 3 jugadores jugada en navegador.
- [x] **Fase 6 — A Ciegas.** Opciones que se reducen con freno en 2, sin feedback durante el juego, y vuelta final carta por carta con compás de 3s. Partida de 5 jugadores jugada entera en navegador.
- [x] **Fase 7 — Cadena.** Turnos, cola aleatoria, intentos descartados a la vista, y timeout que pasa el turno en vez de quemar la carta. Probado con y sin límite de tiempo.
- [x] **Fase 8 — Historial.** Lista por plantilla y fecha, con puesto y puntaje. Abre el podio de cualquier partida vieja. Cubierto por test: lo ve todo usuario registrado que jugó, no solo el host, y nadie ve partidas ajenas.
- [x] **Fase 9 — Animaciones y pulido.** Tokens de movimiento, secuencia focal del
  destape, continuidad entre rondas y fases, acuse del voto, timer vencido, y
  camino de movimiento reducido que conserva el feedback. Se descubrió y arregló
  que 18 animaciones estaban muertas por el scoping de CSS Modules; queda cubierto
  por `pnpm check:css`.
- [ ] **Fase 10 — Prueba real.** Partida con 5+ teléfonos. Bugs de reconexión y timer.
