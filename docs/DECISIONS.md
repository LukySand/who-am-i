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
| 11 | El timer vive en la plantilla, no en la partida | Decisión del usuario. Partida Rápida trae un default editable. |
| 12 | Picker de emoji del sistema, repetidos permitidos | Cero librería de emojis y cero fricción al unirse. |
| 13 | En A Ciegas la reducción de opciones frena en 2 | Evita que la última carta quede forzada sin elección real. |
| 14 | Los campos se revelan solos cada 2,5s | El host igual puede cortar con "Mostrar opciones". Menos toques durante la partida. |
| 15 | Sesiones anónimas habilitadas | Los invitados necesitan `auth.uid()` para que RLS los deje jugar. Vienen apagadas por defecto: hay que activarlas también en el dashboard. |
| 16 | El estado nunca se deriva del payload de Realtime | Ese payload viene sin el filtrado del secreto y puede llegar desordenado. Realtime solo avisa; el estado se relee con `get_game_state`. |
| 17 | Partida Rápida crea una plantilla `is_adhoc` | Así `games.template_id` nunca es null y el motor no necesita un caso especial. No aparece en ninguna lista. |
| 18 | `ensureSession()` valida con `getUser()`, no con `getSession()` | `getSession()` solo lee localStorage. Supabase borra los usuarios anónimos abandonados: el token seguía validando y recién explotaba al insertar en `players`. |
| 19 | `server_now()` como RPC aparte | El deadline es del servidor pero la cuenta regresiva la dibuja el teléfono. El cliente mide el offset una vez. Función chica en vez de meter `now()` en `get_game_state` y tener que duplicarla entera. |
| 20 | La barra del timer se anima con CSS, no con estado | `animation-duration` total + `animation-delay` negativo por lo transcurrido: fluida y sin re-renders. Solo el número tickea. |
| 21 | El compás de 3s de la vuelta final lo cuenta el cliente | Única excepción a la regla 1, y es segura: la partida ya terminó y los puntos están cerrados, así que adelantarse por DevTools no da ventaja. Durante el juego iría contra la regla. |
| 22 | En la vuelta final avanza el host, no un timer | Consistente con el resto: el anfitrión maneja el ritmo. El compás de 3s solo destraba el botón. |
| 23 | En Cadena el timeout pasa el turno, no cierra la carta | `advance_phase` trataba `voting` igual en los tres modos y llamaba a `close_round`, que marca incorrectos a todos los que faltaban: un jugador colgado quemaba la carta entera. Ahora se registra su no-voto y sigue la cola. |
| 24 | Los intentos fallidos de Cadena se muestran a todos | En cuanto alguien dice un nombre en voz alta es información pública. Esconderlo solo obligaría a memorizar. Las opciones **no** se reducen: la regla no lo pide. |
| 25 | El host tiene "Saltear turno" en Cadena | Sin límite de tiempo, un jugador que no responde congela la partida. Es el mismo camino que el vencimiento del timer. |
| 26 | Fechas con `Intl.DateTimeFormat` | Formatea en el idioma activo sin ninguna dependencia. Viene en el navegador. |
| 27 | El historial reusa `/partida/:id` para ver el podio | La partida terminada ya cae en `Finished` por su `status`. Cero pantallas nuevas. |

