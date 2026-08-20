# Arquitectura

## Stack

| Capa | Elección | Motivo |
|---|---|---|
| Front | Vite + React 19 + React Router | SPA estática. El backend es Supabase; no hay nada que renderizar en servidor. |
| Estilos | CSS Modules + tokens en `:root` | Viene en Vite. Cero dependencias. |
| Animación | `@keyframes` + `prefers-reduced-motion` | Alcanza y sobra para el ritmo tipo Kahoot. |
| i18n | objeto `{es, en}` + hook propio | ~30 líneas contra una dependencia entera. |
| Backend | Supabase (Postgres + Auth + Realtime), región `sa-east-1` | Menor latencia desde Argentina. |
| Auth | Magic link + Google OAuth + sesión anónima | Sin contraseñas que guardar. |
| Deploy | Vercel, build estático | Sin serverless functions. |

## Modelo de datos

```
profiles(id → auth.users, display_name, created_at)

templates(id, owner_id, name, fields jsonb, time_limit_s, is_shared, is_adhoc, created_at)
  fields: [{ id, label, required, multi, max_values }]   -- max_values <= 5
  time_limit_s: null = sin limite

games(id, code char(8) unique, host_id, template_id, mode,
      host_plays bool,
      status, round_index, phase, field_index, phase_ends_at, card_order uuid[],
      created_at, finished_at)
  status: lobby | filling | playing | reveal | finished
  phase:  reveal_fields | voting | result

players(id, game_id, user_id null, nickname, emoji, score, is_host, joined_at)

entries(id, game_id, player_id, answers jsonb)     -- EL SECRETO

guesses(id, game_id, round_index, guesser_id, guessed_player_id,
        is_correct, created_at)

chain_turns(id, game_id, round_index, position, player_id, resolved)  -- solo modo Cadena
```

Índices únicos: `(game_id, lower(nickname))`, `(game_id, user_id)`,
`(game_id, round_index, guesser_id)`. El emoji **puede** repetirse.

## Modelo de seguridad

El secreto del juego es la relación **carta → autor**. Si el front pudiera leer
`entries` con su `player_id`, cualquiera gana desde DevTools.

- RLS deniega todo acceso directo a `entries` y `guesses`.
- Todo pasa por funciones `security definer`:

| Función | Devuelve |
|---|---|
| `create_game(template_id, mode, host_plays)` | código de 8 dígitos |
| `join_game(code, nickname, emoji)` | player_id |
| `submit_entry(game_id, answers)` | ok |
| `start_game(game_id)` | ok (valida ≥3 cartas cargadas) |
| `advance_phase(game_id)` | nuevo estado (solo host) |
| `submit_guess(game_id, round_index, guessed_player_id)` | en Relámpago/Cadena: `correcto/incorrecto`. En A Ciegas: solo `ok`. |
| `finalize_game(game_id)` | podio |

- El código de 8 dígitos se genera con reintento sobre violación de unicidad.
- `submit_guess` revalida contra `phase_ends_at`; un voto tardío se rechaza y
  cuenta como error.
- `advance_phase` verifica `auth.uid() = host_id`.

## Realtime

Un canal por partida:
- `postgres_changes` sobre la fila de `games` → sincroniza fase, índice y deadline.
- `postgres_changes` sobre `players` → lista y puntajes.
- `presence` → quién está conectado en el lobby.

El **cliente del host es el reloj**: cuando vence el timer, dispara `advance_phase`.
Cero cron, cero edge functions. El servidor valida, no agenda.

## Reconexión

Sesión anónima de Supabase en localStorage. Al volver, el cliente relee la fila de
`games` y se resuscribe al canal: cae en la fase actual sin estado local.
