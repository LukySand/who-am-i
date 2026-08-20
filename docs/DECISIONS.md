# Decisiones

| # | Decisión | Motivo |
|---|---|---|
| 1 | Vite SPA, no Next.js | El backend es Supabase. SSR y server components no aportan nada acá. |
| 2 | TypeScript | `supabase gen types` tipa todo el schema gratis y mata la clase entera de bugs por nombre de columna. |
| 3 | RPCs `security definer` en vez de queries directas | Único modo de que el mapa carta→autor no viaje al cliente. |
| 4 | El host es el reloj | Evita cron y edge functions. El servidor valida el deadline igual. |
| 5 | Sin librería de animación | CSS `@keyframes` cubre el 100% de lo pedido. |
| 6 | Sin librería de i18n | Dos idiomas y ~150 strings. Un objeto y un hook alcanzan. |
| 7 | Sin sonido | Descartado por el usuario. |
| 8 | El tiempo no desempata | Empates comparten posición. Puntaje más fino queda para después. |
| 9 | Solo campos de texto | Número, fecha y selección quedan para más adelante. |
| 10 | Solo 2 variables de entorno en el front | El repo es público. El client secret de Google vive en el dashboard de Supabase. |
