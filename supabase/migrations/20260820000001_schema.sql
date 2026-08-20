-- Who Am I — schema base
-- El secreto del juego es la relacion carta->autor. Todo lo que pueda revelarla
-- (entries, guesses, chain_turns, el orden de las cartas) queda sin politica RLS:
-- solo lo tocan las funciones security definer de la migracion 0002.

create type game_mode   as enum ('relampago', 'cadena', 'a_ciegas');
create type game_status as enum ('lobby', 'filling', 'playing', 'revealing', 'finished');
create type game_phase  as enum ('reveal_fields', 'voting', 'result');

create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

create table templates (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 60),
  fields       jsonb not null,
  time_limit_s int check (time_limit_s is null or time_limit_s between 5 and 300),
  is_shared    boolean not null default false,
  is_adhoc     boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint fields_shape check (
    jsonb_typeof(fields) = 'array' and jsonb_array_length(fields) between 1 and 8
  )
);
create index on templates (owner_id);

create table games (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[0-9]{8}$'),
  host_id       uuid not null references auth.users on delete cascade,
  template_id   uuid not null references templates on delete restrict,
  mode          game_mode not null,
  host_plays    boolean not null default true,
  status        game_status not null default 'lobby',
  round_index   int not null default 0,
  field_index   int not null default 0,
  phase         game_phase not null default 'reveal_fields',
  phase_ends_at timestamptz,
  created_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index on games (host_id);
-- Solo un codigo activo a la vez; las partidas terminadas liberan el suyo.
create unique index games_active_code on games (code) where finished_at is null;

create table players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references games on delete cascade,
  user_id   uuid references auth.users on delete set null,
  nickname  text not null check (char_length(btrim(nickname)) between 1 and 20),
  emoji     text not null check (char_length(emoji) between 1 and 16),
  score     int not null default 0,
  is_host   boolean not null default false,
  plays     boolean not null default true,
  joined_at timestamptz not null default now()
);
-- El emoji SI puede repetirse; el nombre no.
create unique index players_nickname on players (game_id, lower(btrim(nickname)));
create unique index players_user     on players (game_id, user_id) where user_id is not null;
create index on players (game_id);

-- EL SECRETO. Sin politicas RLS: nadie lee esto directo.
create table entries (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references games on delete cascade,
  player_id  uuid not null references players on delete cascade,
  answers    jsonb not null,
  created_at timestamptz not null default now(),
  unique (game_id, player_id)
);

-- Orden de las cartas. Fuera de `games` a proposito: RLS es por fila, no por
-- columna, y el cliente necesita leer `games` para sincronizar la fase.
create table game_secrets (
  game_id    uuid primary key references games on delete cascade,
  card_order uuid[] not null
);

create table guesses (
  id                uuid primary key default gen_random_uuid(),
  game_id           uuid not null references games on delete cascade,
  round_index       int not null,
  guesser_id        uuid not null references players on delete cascade,
  guessed_player_id uuid references players on delete cascade,
  is_correct        boolean not null,
  created_at        timestamptz not null default now(),
  unique (game_id, round_index, guesser_id)
);

-- Cola de intentos del modo Cadena.
create table chain_turns (
  game_id     uuid not null references games on delete cascade,
  round_index int not null,
  position    int not null,
  player_id   uuid not null references players on delete cascade,
  resolved    boolean not null default false,
  primary key (game_id, round_index, position)
);

alter table profiles     enable row level security;
alter table templates    enable row level security;
alter table games        enable row level security;
alter table players      enable row level security;
alter table entries      enable row level security;
alter table game_secrets enable row level security;
alter table guesses      enable row level security;
alter table chain_turns  enable row level security;

-- security definer para romper la recursion: la politica de `players` no puede
-- consultar `players` bajo su propia politica.
create function is_in_game(p_game_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from players where game_id = p_game_id and user_id = auth.uid())
      or exists (select 1 from games   where id      = p_game_id and host_id = auth.uid());
$$;

create policy own_profile on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy read_templates on templates for select
  using (is_shared or owner_id = auth.uid());
create policy write_templates on templates for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Solo lectura desde el cliente, y solo de partidas propias. Escribir es
-- exclusivo de las RPC. Unirse por codigo pasa por join_game(), asi que nadie
-- puede enumerar partidas ajenas.
create policy read_games   on games   for select using (is_in_game(id));
create policy read_players on players for select using (is_in_game(game_id));

-- entries, game_secrets, guesses y chain_turns quedan SIN politica: RLS activo
-- y sin policy = denegado para todos. Solo entran por las funciones de 0002.

alter publication supabase_realtime add table games;
alter publication supabase_realtime add table players;
