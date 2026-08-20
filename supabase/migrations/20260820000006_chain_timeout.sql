-- Cadena: al vencerse el tiempo de un jugador (o si el host lo saltea) hay que
-- pasarle el turno al siguiente de la cola, no terminar la ronda.
--
-- Antes advance_phase trataba 'voting' igual para los tres modos: llamaba a
-- close_round, que marca como incorrectos a TODOS los que no habian votado. En
-- Cadena eso quemaba la carta entera por un solo jugador que se colgo.
--
-- El no-voto cuenta como error, igual que un voto equivocado: se registra el
-- intento fallido y sigue la cola. Espeja lo que ya hace submit_guess.
create or replace function advance_phase(p_game_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g games; total int; steps int; lim int; cur uuid; nxt uuid;
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
      update games set field_index = steps, phase = 'voting',
                       phase_ends_at = case when lim is null then null else now() + make_interval(secs => lim) end
      where id = p_game_id;
    end if;
    return;
  end if;

  if g.phase = 'voting' then
    -- Cadena: se saltea al jugador de turno, no se cierra la carta.
    if g.mode = 'cadena' then
      select player_id into cur from chain_turns
      where game_id = p_game_id and round_index = g.round_index and not resolved
      order by position limit 1;

      if cur is not null then
        insert into guesses (game_id, round_index, guesser_id, guessed_player_id, is_correct)
        values (p_game_id, g.round_index, cur, null, false)
        on conflict (game_id, round_index, guesser_id) do nothing;

        update chain_turns set resolved = true
        where game_id = p_game_id and round_index = g.round_index and player_id = cur;
      end if;

      select player_id into nxt from chain_turns
      where game_id = p_game_id and round_index = g.round_index and not resolved
      order by position limit 1;

      if nxt is null then
        perform close_round(p_game_id, g.round_index);
        update games set phase = 'result', phase_ends_at = null where id = p_game_id;
      else
        update games set phase_ends_at =
          case when lim is null then null else now() + make_interval(secs => lim) end
        where id = p_game_id;
      end if;
      return;
    end if;

    perform close_round(p_game_id, g.round_index);
    if g.mode = 'a_ciegas' then
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
