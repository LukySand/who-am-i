-- Who Am I — RPCs.
-- Toda escritura y toda lectura del secreto pasa por aca. El cliente nunca
-- consulta entries/guesses/game_secrets/chain_turns directo.

-- answers tiene forma { "<field_id>": ["valor", ...] }: siempre array, aunque el
-- campo sea de un solo valor. Asi el aplanado para revelar de a uno es uniforme.

create function require_user() returns uuid
language plpgsql stable as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'auth required' using errcode = '28000'; end if;
  return uid;
end $$;

create function require_registered() returns uuid
language plpgsql stable as $$
declare uid uuid := require_user();
begin
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'registered account required' using errcode = '28000';
  end if;
  return uid;
end $$;

create function my_player(p_game_id uuid) returns players
language sql security definer stable set search_path = public as $$
  select * from players where game_id = p_game_id and user_id = auth.uid();
$$;

-- Jugadores que participan de verdad: no el host que solo administra, y solo
-- los que cargaron carta.
create function participants(p_game_id uuid) returns setof players
language sql security definer stable set search_path = public as $$
  select p.* from players p
  join entries e on e.player_id = p.id
  where p.game_id = p_game_id and p.plays
  order by p.joined_at;
$$;

create function card_author(p_game_id uuid, p_round int) returns uuid
language sql security definer stable set search_path = public as $$
  select card_order[p_round + 1] from game_secrets where game_id = p_game_id;
$$;

create function round_count(p_game_id uuid) returns int
language sql security definer stable set search_path = public as $$
  select coalesce(array_length(card_order, 1), 0) from game_secrets where game_id = p_game_id;
$$;

-- Los pares (label, valor) de una carta, en orden de revelacion. Un campo
-- multivalor aporta un paso por valor.
create function card_steps(p_game_id uuid, p_round int) returns jsonb
language sql security definer stable set search_path = public as $$
  with e as (
    select answers from entries
    where game_id = p_game_id and player_id = card_author(p_game_id, p_round)
  ),
  t as (
    select tm.fields from games g join templates tm on tm.id = g.template_id where g.id = p_game_id
  ),
  f as (
    select ord, fld ->> 'id' as fid, fld ->> 'label' as label
    from t, jsonb_array_elements(t.fields) with ordinality as x(fld, ord)
  )
  select coalesce(jsonb_agg(
           jsonb_build_object('label', f.label, 'value', v.val)
           order by f.ord, v.vord), '[]'::jsonb)
  from f, e,
       jsonb_array_elements_text(coalesce(e.answers -> f.fid, '[]'::jsonb)) with ordinality as v(val, vord)
  where btrim(v.val) <> '';
$$;

-- A Ciegas: las opciones se reducen a medida que asignas, pero la reduccion
-- frena en 2 para que la ultima carta nunca quede forzada.
create function blind_candidates(p_game_id uuid, p_player_id uuid) returns uuid[]
language plpgsql security definer stable set search_path = public as $$
declare all_ids uuid[]; used uuid[]; left_ids uuid[];
begin
  select array_agg(id) into all_ids from participants(p_game_id) where id <> p_player_id;
  select coalesce(array_agg(guessed_player_id), '{}') into used from guesses
    where game_id = p_game_id and guesser_id = p_player_id and guessed_player_id is not null;
  select array_agg(x) into left_ids from unnest(all_ids) x where not (x = any(used));
  if left_ids is null or array_length(left_ids, 1) <= 2 then return all_ids; end if;
  return left_ids;
end $$;

create function gen_code() returns text
language sql volatile as $$
  select lpad((floor(random() * 100000000))::bigint::text, 8, '0');
$$;

create function create_game(
  p_template_id uuid, p_mode game_mode, p_host_plays boolean,
  p_nickname text, p_emoji text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := require_registered(); gid uuid; c text;
begin
  for i in 1..20 loop
    begin
      c := gen_code();
      insert into games (code, host_id, template_id, mode, host_plays)
      values (c, uid, p_template_id, p_mode, p_host_plays) returning id into gid;
      exit;
    exception when unique_violation then
      if i = 20 then raise exception 'could not allocate game code'; end if;
    end;
  end loop;

  insert into players (game_id, user_id, nickname, emoji, is_host, plays)
  values (gid, uid, btrim(p_nickname), p_emoji, true, p_host_plays);

  return jsonb_build_object('game_id', gid, 'code', c);
end $$;

create function join_game(p_code text, p_nickname text, p_emoji text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := require_user(); g games; pid uuid; n int;
begin
  select * into g from games where code = p_code and finished_at is null;
  if g.id is null then raise exception 'game not found' using errcode = 'P0002'; end if;
  if g.status not in ('lobby', 'filling') then
    raise exception 'game already started' using errcode = 'P0001';
  end if;

  select count(*) into n from players where game_id = g.id;
  if n >= 30 then raise exception 'game full' using errcode = 'P0001'; end if;

  insert into players (game_id, user_id, nickname, emoji)
  values (g.id, uid, btrim(p_nickname), p_emoji)
  returning id into pid;

  return jsonb_build_object('game_id', g.id, 'player_id', pid);
exception when unique_violation then
  raise exception 'nickname taken' using errcode = 'P0001';
end $$;

create function submit_entry(p_game_id uuid, p_answers jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me players; g games;
begin
  me := my_player(p_game_id);
  select * into g from games where id = p_game_id;
  if me.id is null or not me.plays then raise exception 'not a participant'; end if;
  if g.status not in ('lobby', 'filling') then raise exception 'game already started'; end if;

  insert into entries (game_id, player_id, answers) values (p_game_id, me.id, p_answers)
  on conflict (game_id, player_id) do update set answers = excluded.answers;

  update games set status = 'filling' where id = p_game_id and status = 'lobby';
end $$;

-- Arma la cola de intentos de una ronda del modo Cadena. El que acerto la ronda
-- anterior no puede quedar primero.
create function build_chain(p_game_id uuid, p_round int) returns void
language plpgsql security definer set search_path = public as $$
declare subject uuid := card_author(p_game_id, p_round); prev_winner uuid; ids uuid[];
begin
  if p_round > 0 then
    select guesser_id into prev_winner from guesses
    where game_id = p_game_id and round_index = p_round - 1 and is_correct limit 1;
  end if;

  select array_agg(id order by random()) into ids
  from participants(p_game_id) where id <> subject;

  if ids is null then return; end if;
  if array_length(ids, 1) > 1 and ids[1] = prev_winner then
    ids[1] := ids[2]; ids[2] := prev_winner;
  end if;

  insert into chain_turns (game_id, round_index, position, player_id)
  select p_game_id, p_round, i, ids[i] from generate_series(1, array_length(ids, 1)) i;
end $$;

create function start_game(p_game_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g games; ids uuid[]; lim int;
begin
  select * into g from games where id = p_game_id;
  if g.host_id <> require_user() then raise exception 'host only'; end if;
  if g.status not in ('lobby', 'filling') then raise exception 'already started'; end if;

  select array_agg(id order by random()) into ids from participants(p_game_id);
  if coalesce(array_length(ids, 1), 0) < 3 then
    raise exception 'need at least 3 cards' using errcode = 'P0001';
  end if;

  insert into game_secrets (game_id, card_order) values (p_game_id, ids);

  select time_limit_s into lim from templates where id = g.template_id;
  update games set status = 'playing', round_index = 0, field_index = 0,
                   phase = 'reveal_fields', phase_ends_at = null
  where id = p_game_id;

  if g.mode = 'cadena' then perform build_chain(p_game_id, 0); end if;
end $$;

-- Cierra la ronda: los que no votaron cuentan como error, y se suman los puntos.
create function close_round(p_game_id uuid, p_round int) returns void
language plpgsql security definer set search_path = public as $$
declare subject uuid := card_author(p_game_id, p_round);
begin
  insert into guesses (game_id, round_index, guesser_id, guessed_player_id, is_correct)
  select p_game_id, p_round, p.id, null, false
  from participants(p_game_id) p
  where p.id <> subject
  on conflict (game_id, round_index, guesser_id) do nothing;

  update players p set score = p.score + 1
  from guesses gu
  where gu.game_id = p_game_id and gu.round_index = p_round
    and gu.guesser_id = p.id and gu.is_correct;
end $$;

create function advance_phase(p_game_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g games; total int; steps int; lim int;
begin
  select * into g from games where id = p_game_id;
  if g.host_id <> require_user() then raise exception 'host only'; end if;

  total := round_count(p_game_id);
  select time_limit_s into lim from templates where id = g.template_id;

  -- Revelacion final de A Ciegas: recorre las rondas mostrando resultados.
  if g.status = 'revealing' then
    if g.round_index + 1 >= total then
      update games set status = 'finished', finished_at = now() where id = p_game_id;
    else
      update games set round_index = g.round_index + 1 where id = p_game_id;
    end if;
    return;
  end if;

  if g.status <> 'playing' then raise exception 'game not running'; end if;

  if g.phase = 'reveal_fields' then
    steps := jsonb_array_length(card_steps(p_game_id, g.round_index));
    if g.field_index + 1 < steps then
      update games set field_index = g.field_index + 1 where id = p_game_id;
    else
      -- "Mostrar opciones": abre la votacion y fija el deadline en la base.
      update games set field_index = steps, phase = 'voting',
                       phase_ends_at = case when lim is null then null else now() + make_interval(secs => lim) end
      where id = p_game_id;
    end if;
    return;
  end if;

  if g.phase = 'voting' then
    perform close_round(p_game_id, g.round_index);
    if g.mode = 'a_ciegas' then
      -- Sin feedback: se pasa derecho a la ronda siguiente.
      if g.round_index + 1 >= total then
        update games set status = 'revealing', round_index = 0, phase = 'result',
                         phase_ends_at = null
        where id = p_game_id;
      else
        update games set round_index = g.round_index + 1, field_index = 0,
                         phase = 'reveal_fields', phase_ends_at = null
        where id = p_game_id;
      end if;
    else
      update games set phase = 'result', phase_ends_at = null where id = p_game_id;
    end if;
    return;
  end if;

  -- phase = 'result'
  if g.round_index + 1 >= total then
    update games set status = 'finished', finished_at = now() where id = p_game_id;
  else
    update games set round_index = g.round_index + 1, field_index = 0,
                     phase = 'reveal_fields', phase_ends_at = null
    where id = p_game_id;
    if g.mode = 'cadena' then perform build_chain(p_game_id, g.round_index + 1); end if;
  end if;
end $$;

create function submit_guess(p_game_id uuid, p_round int, p_guess uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g games; me players; subject uuid; ok boolean; nxt uuid;
begin
  select * into g from games where id = p_game_id;
  me := my_player(p_game_id);

  if me.id is null or not me.plays then raise exception 'not a participant'; end if;
  if g.status <> 'playing' or g.phase <> 'voting' or g.round_index <> p_round then
    raise exception 'not accepting votes' using errcode = 'P0001';
  end if;
  -- El reloj vive en la base: un voto tardio se rechaza, no se acepta "por poco".
  if g.phase_ends_at is not null and now() > g.phase_ends_at then
    raise exception 'time is up' using errcode = 'P0001';
  end if;

  subject := card_author(p_game_id, p_round);
  if me.id = subject then raise exception 'cannot vote on your own card'; end if;
  if p_guess = me.id then raise exception 'cannot vote yourself'; end if;

  if g.mode = 'a_ciegas' and not (p_guess = any(blind_candidates(p_game_id, me.id))) then
    raise exception 'candidate already used' using errcode = 'P0001';
  end if;

  if g.mode = 'cadena' then
    if not exists (select 1 from chain_turns
                   where game_id = p_game_id and round_index = p_round
                     and player_id = me.id and not resolved
                     and position = (select min(position) from chain_turns
                                     where game_id = p_game_id and round_index = p_round and not resolved))
    then raise exception 'not your turn' using errcode = 'P0001'; end if;
  end if;

  ok := (p_guess = subject);

  insert into guesses (game_id, round_index, guesser_id, guessed_player_id, is_correct)
  values (p_game_id, p_round, me.id, p_guess, ok);

  if g.mode = 'cadena' then
    update chain_turns set resolved = true
    where game_id = p_game_id and round_index = p_round and player_id = me.id;

    if ok then
      update players set score = score + 1 where id = me.id;
      update games set phase = 'result', phase_ends_at = null where id = p_game_id;
    else
      select player_id into nxt from chain_turns
      where game_id = p_game_id and round_index = p_round and not resolved
      order by position limit 1;
      if nxt is null then
        -- Nadie acerto: se revela el autor y no suma nadie.
        update games set phase = 'result', phase_ends_at = null where id = p_game_id;
      else
        update games set phase_ends_at =
          case when g.phase_ends_at is null then null
               else now() + (select make_interval(secs => time_limit_s) from templates where id = g.template_id) end
        where id = p_game_id;
      end if;
    end if;
    return jsonb_build_object('correct', ok);
  end if;

  -- Relampago y A Ciegas no devuelven el resultado: se revela en la fase 'result'.
  return jsonb_build_object('ok', true);
exception when unique_violation then
  raise exception 'already voted' using errcode = 'P0001';
end $$;

-- Boton "Mostrar opciones" del host: saltea los campos que falten y abre la
-- votacion. Los campos se revelan solos de a uno; esto corta la espera.
create function open_voting(p_game_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g games; lim int;
begin
  select * into g from games where id = p_game_id;
  if g.host_id <> require_user() then raise exception 'host only'; end if;
  if g.status <> 'playing' or g.phase <> 'reveal_fields' then
    raise exception 'not revealing' using errcode = 'P0001';
  end if;
  select time_limit_s into lim from templates where id = g.template_id;
  update games set
    field_index = greatest(jsonb_array_length(card_steps(p_game_id, g.round_index)) - 1, 0),
    phase = 'voting',
    phase_ends_at = case when lim is null then null else now() + make_interval(secs => lim) end
  where id = p_game_id;
end $$;
