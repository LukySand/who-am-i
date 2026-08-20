-- Lector de estado. Una sola RPC por refresco: el cliente no puede pedir de mas,
-- y el autor de la carta solo viaja cuando la fase ya lo revelo.

create function podium(p_game_id uuid) returns jsonb
language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'player_id', id, 'nickname', nickname, 'emoji', emoji,
           'score', score, 'position', pos) order by pos, nickname), '[]'::jsonb)
  from (
    select p.id, p.nickname, p.emoji, p.score,
           rank() over (order by p.score desc) as pos
    from participants(p_game_id) p
  ) q;
$$;

create function get_game_state(p_game_id uuid) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
  g games; tmpl templates; me players;
  total int; subject uuid; revealed int; all_steps jsonb;
  is_result boolean; state jsonb; round jsonb;
begin
  select * into g from games where id = p_game_id;
  if g.id is null then raise exception 'game not found' using errcode = 'P0002'; end if;
  if not is_in_game(p_game_id) then raise exception 'not in this game' using errcode = '42501'; end if;

  select * into tmpl from templates where id = g.template_id;
  me := my_player(p_game_id);
  total := round_count(p_game_id);

  state := jsonb_build_object(
    'game', jsonb_build_object(
      'id', g.id, 'code', g.code, 'mode', g.mode, 'status', g.status,
      'round_index', g.round_index, 'field_index', g.field_index, 'phase', g.phase,
      'phase_ends_at', g.phase_ends_at, 'host_plays', g.host_plays, 'total_rounds', total),
    'template', jsonb_build_object(
      'name', tmpl.name, 'fields', tmpl.fields, 'time_limit_s', tmpl.time_limit_s),
    'me', case when me.id is null then null else jsonb_build_object(
      'player_id', me.id, 'is_host', me.is_host, 'plays', me.plays) end,
    'players', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', p.id, 'nickname', p.nickname, 'emoji', p.emoji, 'score', p.score,
               'is_host', p.is_host, 'plays', p.plays,
               'has_entry', exists (select 1 from entries e where e.player_id = p.id))
             order by p.joined_at), '[]'::jsonb)
      from players p where p.game_id = p_game_id)
  );

  if g.status = 'finished' then
    return state || jsonb_build_object('podium', podium(p_game_id));
  end if;

  if g.status not in ('playing', 'revealing') then
    return state;
  end if;

  subject   := card_author(p_game_id, g.round_index);
  all_steps := card_steps(p_game_id, g.round_index);
  is_result := (g.phase = 'result' or g.status = 'revealing');
  -- En reveal_fields se muestran field_index+1 pasos; despues, todos.
  revealed  := case when g.phase = 'reveal_fields'
                    then least(g.field_index + 1, jsonb_array_length(all_steps))
                    else jsonb_array_length(all_steps) end;

  round := jsonb_build_object(
    'index', g.round_index,
    'total', total,
    'steps', (select coalesce(jsonb_agg(s order by o), '[]'::jsonb)
              from jsonb_array_elements(all_steps) with ordinality as x(s, o)
              where o <= revealed),
    'is_mine', me.id is not distinct from subject,
    'author_id', case when is_result then subject else null end,
    'candidates', case
      when me.id is null or me.id = subject then '[]'::jsonb
      when g.mode = 'a_ciegas' then to_jsonb(blind_candidates(p_game_id, me.id))
      else (select coalesce(jsonb_agg(id), '[]'::jsonb) from participants(p_game_id) where id <> me.id)
    end,
    'my_guess', (select guessed_player_id from guesses
                 where game_id = p_game_id and round_index = g.round_index and guesser_id = me.id),
    'results', case when not is_result then '[]'::jsonb else (
      select coalesce(jsonb_agg(jsonb_build_object(
               'guesser_id', guesser_id, 'guessed_player_id', guessed_player_id,
               'is_correct', is_correct)), '[]'::jsonb)
      from guesses where game_id = p_game_id and round_index = g.round_index) end
  );

  if g.mode = 'cadena' then
    round := round || jsonb_build_object(
      'chain', jsonb_build_object(
        'current', (select player_id from chain_turns
                    where game_id = p_game_id and round_index = g.round_index and not resolved
                    order by position limit 1),
        'attempts', (select coalesce(jsonb_agg(jsonb_build_object(
                       'guesser_id', guesser_id, 'guessed_player_id', guessed_player_id)
                       order by created_at), '[]'::jsonb)
                     from guesses
                     where game_id = p_game_id and round_index = g.round_index and not is_correct)));
  end if;

  return state || jsonb_build_object('round', round);
end $$;

-- Historial: toda partida terminada que jugue, no solo las que hostee.
create function my_history() returns jsonb
language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'game_id', g.id, 'mode', g.mode, 'template', t.name,
           'played_at', g.finished_at, 'nickname', p.nickname, 'emoji', p.emoji,
           'score', p.score,
           'position', (select (e ->> 'position')::int
                        from jsonb_array_elements(podium(g.id)) e
                        where (e ->> 'player_id')::uuid = p.id),
           'players', (select count(*) from participants(g.id)))
         order by g.finished_at desc), '[]'::jsonb)
  from players p
  join games g on g.id = p.game_id
  join templates t on t.id = g.template_id
  where p.user_id = auth.uid() and g.status = 'finished';
$$;

-- Permisos explicitos, no heredados.
--
-- Supabase hospedado aplica `alter default privileges` que otorga SELECT a
-- anon/authenticated sobre tablas nuevas de public; el stack local no. Sin
-- declararlo, el mismo SQL da resultados distintos en local y en prod: aca las
-- policies de games/players no harian nada porque falta el GRANT de base.
grant select on games, players to anon, authenticated;
grant select, insert, update, delete on templates to authenticated;
grant select, insert, update, delete on profiles  to authenticated;

-- El secreto: ni GRANT ni policy. Solo entra por las funciones security definer.
revoke all on entries, game_secrets, guesses, chain_turns from anon, authenticated;
revoke insert, update, delete on games, players from anon, authenticated;

-- Los helpers internos filtran el secreto si se los llama directo. Postgres da
-- EXECUTE a PUBLIC por defecto, asi que hay que revocar de PUBLIC: revocar solo
-- de anon/authenticated no quita nada.
revoke execute on function
  my_player(uuid), participants(uuid), card_author(uuid, int), round_count(uuid),
  card_steps(uuid, int), blind_candidates(uuid, uuid), close_round(uuid, int),
  build_chain(uuid, int), gen_code(), podium(uuid), require_user(), require_registered()
from public, anon, authenticated;

-- is_in_game la necesitan las policies de RLS, que corren como el usuario.
grant execute on function is_in_game(uuid) to anon, authenticated;

-- La superficie publica de la API: nada mas que esto.
grant execute on function
  create_game(uuid, game_mode, boolean, text, text), join_game(text, text, text),
  submit_entry(uuid, jsonb), start_game(uuid), open_voting(uuid),
  advance_phase(uuid), submit_guess(uuid, int, uuid),
  get_game_state(uuid), my_history()
to anon, authenticated;
