-- Juega una partida completa en cada modo y verifica reglas y puntajes.
-- Correr con: pnpm test:db

\set ON_ERROR_STOP on
set client_min_messages = warning;

create or replace function t_user(p_email text) returns uuid
language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          uid || '-' || p_email, '', now(), now(), now());
  return uid;
end $$;

create or replace function t_as(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, false);
$$;

create or replace function t_fields() returns jsonb language sql as $$
  select '[{"id":"f1","label":"Un miedo","required":true,"multi":false,"max_values":1},
           {"id":"f2","label":"Hobbies","required":false,"multi":true,"max_values":5}]'::jsonb;
$$;

create or replace function t_answers(p_tag text) returns jsonb language sql as $$
  select jsonb_build_object('f1', jsonb_build_array('miedo-' || p_tag),
                            'f2', jsonb_build_array('hobby-' || p_tag, 'otro-' || p_tag));
$$;

create or replace function t_pid(p_gid uuid, p_uid uuid) returns uuid language sql as $$
  select id from players where game_id = p_gid and user_id = p_uid;
$$;

create or replace function t_uid(p_gid uuid, p_pid uuid) returns uuid language sql as $$
  select user_id from players where game_id = p_gid and id = p_pid;
$$;

-- Deja la partida armada y arrancada.
create or replace function t_setup(p_mode game_mode, out gid uuid, out ids uuid[])
language plpgsql as $$
declare a uuid; b uuid; c uuid; d uuid; tid uuid; res jsonb; cd text; u uuid;
begin
  a := t_user('a-' || p_mode || '@t.co'); b := t_user('b-' || p_mode || '@t.co');
  c := t_user('c-' || p_mode || '@t.co'); d := t_user('d-' || p_mode || '@t.co');
  ids := array[a, b, c, d];

  perform t_as(a);
  insert into templates (owner_id, name, fields, time_limit_s)
  values (a, 'Test', t_fields(), null) returning id into tid;

  res := create_game(tid, p_mode, true, 'Ana', 'A');
  gid := (res ->> 'game_id')::uuid;
  select g.code into cd from games g where g.id = gid;

  perform t_as(b); perform join_game(cd, 'Beto', 'B');
  perform t_as(c); perform join_game(cd, 'Cami', 'C');
  perform t_as(d); perform join_game(cd, 'Dani', 'D');

  foreach u in array ids loop
    perform t_as(u);
    perform submit_entry(gid, t_answers(u::text));
  end loop;

  perform t_as(ids[1]);
  perform start_game(gid);
end $$;

------------------------------------------------------------------ RELAMPAGO
do $$
declare
  gid uuid; ids uuid[]; g games; subject uuid; steps int; voters uuid[];
  right_p uuid; wrong_p uuid; silent_p uuid; st jsonb; n int;
begin
  select * into gid, ids from t_setup('relampago');

  subject := card_author(gid, 0);
  select array_agg(id) into voters from participants(gid) where id <> subject;
  right_p := voters[1]; wrong_p := voters[2]; silent_p := voters[3];

  -- 3 pasos de revelacion: 1 valor de f1 + 2 de f2.
  steps := jsonb_array_length(card_steps(gid, 0));
  assert steps = 3, 'esperaba 3 pasos de revelacion, hubo ' || steps;

  perform t_as(ids[1]);
  select * into g from games where id = gid;
  assert g.phase = 'reveal_fields' and g.field_index = 0, 'arranca revelando';

  -- No se puede votar antes de que abra la votacion.
  perform t_as(t_uid(gid, right_p));
  begin
    perform submit_guess(gid, 0, subject);
    assert false, 'no deberia aceptar votos en reveal_fields';
  exception when assert_failure then raise; when others then null; end;

  perform t_as(ids[1]);
  perform open_voting(gid);
  select * into g from games where id = gid;
  assert g.phase = 'voting', 'open_voting abre la votacion';
  assert g.field_index = steps - 1, 'open_voting revela todos los campos';

  -- El dueno de la carta no puede votar.
  perform t_as(t_uid(gid, subject));
  begin
    perform submit_guess(gid, 0, right_p);
    assert false, 'el autor no deberia poder votar su propia carta';
  exception when assert_failure then raise; when others then null; end;

  perform t_as(t_uid(gid, right_p));  perform submit_guess(gid, 0, subject);
  perform t_as(t_uid(gid, wrong_p));  perform submit_guess(gid, 0, right_p);
  -- silent_p no vota a proposito.

  perform t_as(t_uid(gid, right_p));
  begin
    perform submit_guess(gid, 0, subject);
    assert false, 'no deberia aceptar dos votos del mismo jugador';
  exception when assert_failure then raise; when others then null; end;

  -- Relampago no filtra el resultado al votar.
  perform t_as(t_uid(gid, right_p));
  st := get_game_state(gid);
  assert st #>> '{round,author_id}' is null, 'el autor no puede viajar durante la votacion';

  perform t_as(ids[1]);
  perform advance_phase(gid);   -- voting -> result

  st := get_game_state(gid);
  assert (st #>> '{round,author_id}')::uuid = subject, 'en result se revela el autor';

  assert (select score from players where id = right_p) = 1, 'acierto suma 1';
  assert (select score from players where id = wrong_p) = 0, 'error suma 0';
  assert (select score from players where id = silent_p) = 0, 'no votar suma 0';
  assert (select count(*) from guesses where game_id = gid and round_index = 0) = 3,
         'no votar queda registrado como error, no como ausencia';

  perform t_as(ids[1]);
  for n in 1..20 loop
    select * into g from games where id = gid;
    exit when g.status = 'finished';
    if g.phase = 'reveal_fields' then perform open_voting(gid);
    else perform advance_phase(gid); end if;
  end loop;

  select * into g from games where id = gid;
  assert g.status = 'finished', 'tras 4 rondas la partida termina, quedo en ' || g.status;

  st := get_game_state(gid);
  assert jsonb_array_length(st -> 'podium') = 4, 'el podio lista los 4 jugadores';
  -- 1 acierto y 3 empatados en 0 => posiciones 1, 2, 2, 2
  assert (select count(*) from jsonb_array_elements(st -> 'podium') e
          where (e ->> 'position')::int = 2) = 3, 'los empatados comparten posicion';
  raise notice 'RELAMPAGO ok';
end $$;

------------------------------------------------------------------ CADENA
do $$
declare
  gid uuid; ids uuid[]; subject uuid; first_p uuid; second_p uuid;
  st jsonb; g games; winner uuid; nxt uuid;
begin
  select * into gid, ids from t_setup('cadena');
  subject := card_author(gid, 0);

  select player_id into first_p from chain_turns
    where game_id = gid and round_index = 0 and position = 1;
  select player_id into second_p from chain_turns
    where game_id = gid and round_index = 0 and position = 2;

  assert (select count(*) from chain_turns where game_id = gid and round_index = 0) = 3,
         'la cola excluye al autor de la carta';

  perform t_as(ids[1]); perform open_voting(gid);

  -- Fuera de turno no se puede intentar.
  perform t_as(t_uid(gid, second_p));
  begin
    perform submit_guess(gid, 0, subject);
    assert false, 'no deberia poder adivinar fuera de turno';
  exception when assert_failure then raise; when others then null; end;

  -- El primero falla, sigue el segundo.
  perform t_as(t_uid(gid, first_p));
  assert (submit_guess(gid, 0, second_p) ->> 'correct') = 'false', 'fallo esperado';
  select * into g from games where id = gid;
  assert g.phase = 'voting', 'tras un fallo la ronda sigue';
  st := get_game_state(gid);
  assert (st #>> '{round,chain,current}')::uuid = second_p, 'el turno pasa al siguiente';

  -- El segundo acierta: cierra la ronda y suma 1.
  perform t_as(t_uid(gid, second_p));
  assert (submit_guess(gid, 0, subject) ->> 'correct') = 'true', 'acierto esperado';
  select * into g from games where id = gid;
  assert g.phase = 'result', 'un acierto cierra la ronda';
  assert (select score from players where id = second_p) = 1, 'el que acierta suma 1';
  assert (select score from players where id = first_p) = 0, 'el que fallo no suma';
  winner := second_p;

  -- Ronda 1: el ganador anterior no abre la cola.
  perform t_as(ids[1]); perform advance_phase(gid);
  select player_id into nxt from chain_turns
    where game_id = gid and round_index = 1 and position = 1;
  assert nxt <> winner, 'el que acerto no puede ser el primero de la ronda siguiente';

  -- Nadie acierta: se revela y no suma nadie.
  perform t_as(ids[1]); perform open_voting(gid);
  subject := card_author(gid, 1);
  for nxt in select player_id from chain_turns
             where game_id = gid and round_index = 1 order by position loop
    perform t_as(t_uid(gid, nxt));
    perform submit_guess(gid, 1, (select id from participants(gid)
                                  where id <> subject and id <> nxt limit 1));
  end loop;
  select * into g from games where id = gid;
  assert g.phase = 'result', 'agotada la cola se revela igual';
  assert (select sum(score) from players where game_id = gid) = 1,
         'nadie sumo en la ronda sin aciertos';
  raise notice 'CADENA ok';
end $$;

-------------------------------------- CADENA: timeout pasa el turno
-- Si a un jugador se le vence el tiempo, la carta NO se quema: se registra su
-- no-voto como error y sigue el siguiente de la cola. Antes advance_phase
-- llamaba a close_round y marcaba incorrectos a todos los que faltaban.
do $$
declare
  gid uuid; ids uuid[]; cola uuid[]; cur uuid; pendientes int; g2 games;
begin
  select * into gid, ids from t_setup('cadena');
  perform t_as(ids[1]); perform open_voting(gid);

  select array_agg(player_id order by position) into cola
  from chain_turns where game_id = gid and round_index = 0;
  assert array_length(cola, 1) = 3, 'con 4 participantes la cola es de 3';

  cur := cola[1];

  -- El host saltea al de turno: mismo camino que el vencimiento del timer.
  perform t_as(ids[1]);
  perform advance_phase(gid);

  select * into g2 from games where id = gid;
  assert g2.phase = 'voting',
    'la carta sigue viva tras un timeout, quedo en ' || g2.phase;

  select count(*) into pendientes from chain_turns
  where game_id = gid and round_index = 0 and not resolved;
  assert pendientes = 2, 'deben quedar 2 turnos, quedaron ' || pendientes;

  assert exists (select 1 from guesses where game_id = gid and round_index = 0
                 and guesser_id = cur and guessed_player_id is null and not is_correct),
    'el no-voto queda registrado como error';

  assert (select count(*) from guesses where game_id = gid and round_index = 0) = 1,
    'solo se marca al que se colgo, no a los que todavia no jugaron';

  -- Se saltean los dos que quedan: ahi si se cierra la carta.
  perform advance_phase(gid);
  perform advance_phase(gid);
  select * into g2 from games where id = gid;
  assert g2.phase = 'result', 'agotada la cola se pasa a result, quedo en ' || g2.phase;
  assert (select sum(score) from players where game_id = gid) = 0,
    'nadie suma si nadie acerto';

  raise notice 'CADENA timeout ok';
end $$;

------------------------------------------------------------------ A CIEGAS
do $$
declare
  gid uuid; ids uuid[]; me uuid; subject uuid; cands jsonb; st jsonb; g games;
  pick uuid; r int;
begin
  select * into gid, ids from t_setup('a_ciegas');
  me := t_pid(gid, ids[2]);

  for r in 0..3 loop
    perform t_as(ids[1]); perform open_voting(gid);
    subject := card_author(gid, r);

    perform t_as(t_uid(gid, me));
    st := get_game_state(gid);
    assert st #>> '{round,author_id}' is null, 'a ciegas no revela el autor en juego';

    if me <> subject then
      cands := st #> '{round,candidates}';
      -- La reduccion frena en 2: nunca menos de 2 opciones.
      assert jsonb_array_length(cands) >= 2,
             'siempre debe haber al menos 2 opciones, hubo ' || jsonb_array_length(cands);
      pick := (cands ->> 0)::uuid;
      perform submit_guess(gid, r, pick);
    end if;

    perform t_as(ids[1]);
    perform advance_phase(gid);
  end loop;

  select * into g from games where id = gid;
  assert g.status = 'revealing', 'termina en revelacion, quedo en ' || g.status;
  assert g.round_index = 0, 'la revelacion arranca en la primera carta';

  perform t_as(t_uid(gid, me));
  st := get_game_state(gid);
  assert st #>> '{round,author_id}' is not null, 'en revelacion si se muestra el autor';
  assert jsonb_array_length(st #> '{round,results}') > 0, 'se muestran aciertos y errores';

  perform t_as(ids[1]);
  for r in 1..20 loop
    select * into g from games where id = gid;
    exit when g.status = 'finished';
    perform advance_phase(gid);
  end loop;
  select * into g from games where id = gid;
  assert g.status = 'finished', 'tras revelar todo, termina';
  raise notice 'A CIEGAS ok';
end $$;

-------------------------------------- A CIEGAS: reduccion de candidatos
-- Con 5 participantes el jugador ve 4 candidatos. La reduccion frena en 2, asi
-- que la progresion esperada es 4 -> 3 -> 4 -> 4: en cuanto quedarian menos de
-- 2 sin usar vuelven todos, y la ultima carta nunca queda forzada.
--
-- No hace falta arrancar la partida: blind_candidates solo depende de
-- participants() (jugadores con ficha) y de guesses.
do $$
declare
  host uuid; u uuid; gid uuid; tid uuid; cd text; me uuid; others uuid[];
  n int; expected int[] := array[4, 3, 4, 4]; i int; nm text;
begin
  host := t_user('host-blind5@t.co');
  perform t_as(host);
  insert into templates (owner_id, name, fields, time_limit_s)
  values (host, 'Blind5', t_fields(), null) returning id into tid;
  gid := (create_game(tid, 'a_ciegas', true, 'Ana', 'A') ->> 'game_id')::uuid;
  select code into cd from games where id = gid;
  perform submit_entry(gid, t_answers(host::text));

  foreach nm in array array['Beto', 'Cami', 'Dani', 'Emi'] loop
    u := t_user(nm || '-blind5@t.co');
    perform t_as(u);
    perform join_game(cd, nm, left(nm, 1));
    perform submit_entry(gid, t_answers(u::text));
  end loop;

  assert (select count(*) from participants(gid)) = 5, 'deben ser 5 participantes';

  select id into me from players where game_id = gid and nickname = 'Beto';
  select array_agg(id) into others from participants(gid) where id <> me;
  assert array_length(others, 1) = 4, 'el jugador debe ver 4 candidatos';

  for i in 1..4 loop
    n := array_length(blind_candidates(gid, me), 1);
    assert n = expected[i],
      'tras ' || (i - 1) || ' asignaciones esperaba ' || expected[i] || ', hubo ' || n;
    -- Se registra la asignacion directo: lo que se prueba es la funcion.
    insert into guesses (game_id, round_index, guesser_id, guessed_player_id, is_correct)
    values (gid, 100 + i, me, others[i], false);
  end loop;

  raise notice 'A CIEGAS reduccion ok';
end $$;

------------------------------------------------------------------ HISTORIAL
do $$
declare h jsonb;
begin
  perform t_as((select p.user_id from players p join games g on g.id = p.game_id
                where g.status = 'finished' and p.user_id is not null limit 1));
  h := my_history();
  assert jsonb_array_length(h) >= 1, 'el historial debe listar las partidas jugadas';
  assert (h #>> '{0,position}') is not null, 'el historial trae la posicion en el podio';
  raise notice 'HISTORIAL ok';
end $$;

select 'TODOS LOS TESTS PASARON' as resultado;
