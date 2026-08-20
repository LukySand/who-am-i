# Roadmap

- [x] **Fase 1 — Pipeline.** Scaffold Vite+React+TS, build verde, docs.
- [x] **Fase 1b — GitHub.** Pusheado a `LukySand/who-am-i`. Falta Vercel + `db push` (necesitan tus credenciales).
- [x] **Fase 2 — Base de datos.** Migraciones, RLS, RPCs, generador de códigos, 6 plantillas de fábrica (3 × 2 idiomas). Tests de las tres modalidades + test de RLS con rol `authenticated`.
- [x] **Fase 3 — Auth y lobby.** Magic link, Google, sesión anónima. Home, crear partida, unirse por código, nombre + emoji, lobby en vivo por Realtime. Verificado en navegador contra la base local.
- [x] **Fase 4 — Plantillas.** Creador con campos obligatorios/opcionales/multivalor, timer en la plantilla, compartir. Partida Rápida (plantilla descartable). Formulario de ficha integrado al flujo de partida. Verificado en navegador, incluido el login por magic link.
- [x] **Fase 5 — Motor + Relámpago.** Máquina de estados, revelación automática cada 2,5s, timer contra el reloj del servidor, controles del host, resultado de ronda y podio con posiciones compartidas. Partida completa de 3 jugadores jugada en navegador.
- [ ] **Fase 6 — A Ciegas.** Reusa el motor. Opciones que se reducen + revelación final.
- [ ] **Fase 7 — Cadena.** Turnos y cola aleatoria.
- [ ] **Fase 8 — Historial.** Pantalla de historial por plantilla y fecha (el podio ya salió en la fase 5).
- [ ] **Fase 9 — Animaciones y pulido.** Transiciones, cuenta regresiva, revelación, podio.
- [ ] **Fase 10 — Prueba real.** Partida con 5+ teléfonos. Bugs de reconexión y timer.
