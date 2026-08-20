# Reglas de juego

## Conceptos

- **Plantilla**: conjunto de campos que cada jugador responde, más el timer.
  Campos obligatorios y opcionales. Un campo puede admitir múltiples valores
  (hasta 5). Cada valor se revela por separado, como si fuera un campo aparte.
- **Carta**: las respuestas de un jugador a la plantilla. Es el secreto del juego.
- **Partida**: se identifica por plantilla + fecha. No tiene nombre.
- **Código**: 8 dígitos numéricos, único entre partidas activas.

## Reglas comunes a los tres modos

- 3 jugadores mínimo, 30 máximo.
- No se puede entrar una vez empezada la partida.
- **Nunca te toca tu propia carta.** Cuando sale, quedás fuera de esa ronda:
  no votás y no sumás puntos.
- Los campos de una carta se revelan **de a uno cada 2,5 segundos**, con animación,
  en los tres modos. El host puede cortar la espera con "Mostrar opciones".
- Acierto = 1 punto. Error o no votar = 0 puntos.
- **Empate = posición compartida.** El tiempo no desempata (por ahora).
- Si alguien se desconecta: su carta sigue en juego y sigue en el podio.
- El host puede echar jugadores **solo antes de empezar**.
- El host elige al crear la partida si **juega y administra** o **solo administra**.
  Si solo administra: no carga carta, no es candidato y no aparece en el podio.
- **El timer vive en la plantilla**: con tiempo (N segundos) o sin límite.
- **Partida Rápida**: el host escribe los campos en el momento. Genera una plantilla
  descartable (`is_adhoc`) con un timer por defecto que puede cambiar de un toque.
- El emoji lo elige el teclado del sistema. Dos jugadores pueden repetir emoji.

## Modo 1 — Relámpago

Todos votan a la vez, con feedback inmediato.

1. Se revelan los campos de una carta, de a uno.
2. El host cierra la votación y muestra las opciones (todos los participantes).
3. Cada jugador elige. Corre el timer si está configurado.
4. Se revela el autor y quién acertó. Puntos al instante.
5. El host pasa a la siguiente carta.

Las opciones **no** se reducen: todos los participantes están siempre disponibles.

Controles del host: `Mostrar opciones` (cierra revelación, abre votación) y
`Siguiente` (cierra votación, revela, avanza).

## Modo 2 — Cadena

Por turnos, encadenado.

1. Se elige una carta al azar entre las no jugadas.
2. Se arma una cola aleatoria con todos los jugadores elegibles (todos menos el autor).
3. El primero de la cola intenta adivinar. Si acierta: 1 punto, se revela el autor,
   se pasa a la carta siguiente.
4. Si falla: pasa al siguiente de la cola. Cada jugador intenta **una sola vez** por carta.
5. Si nadie acierta: se revela el autor y **nadie suma**.
   - Si a un jugador se le vence el tiempo (o el host lo saltea), cuenta como
     error y sigue la cola: **no** se quema la carta.
   - Los intentos fallidos quedan a la vista de todos. Las opciones no se reducen.
6. El que acertó una carta **no puede ser el primero** de la cola en la carta siguiente.

## Modo 3 — A Ciegas

Quiz sin feedback, resultados al final.

1. Se revelan los campos de cada carta, de a uno. Todos votan en secreto.
2. **Las opciones se reducen**: un jugador que ya asignó a Ana en una carta no
   puede volver a elegirla. **La reducción se detiene al llegar a 2 opciones** —
   de ahí en adelante vuelven a estar todos los candidatos disponibles, así el
   final nunca queda forzado.
3. Sin feedback durante la partida.
4. Al final se recorren las cartas una por una: se muestran los datos, corre un
   timer de 3 segundos, y se revela el autor junto con quién acertó y quién no.
5. Podio.

## Podio

Ordenado por puntos, descendente. Empate comparte posición (1, 2, 2, 4).
