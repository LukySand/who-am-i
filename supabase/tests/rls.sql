-- Verifica el modelo de seguridad con el rol real del cliente (`authenticated`),
-- no como superusuario. Sin esto, "el cliente nunca ve el secreto" es una promesa
-- sin evidencia: psql como postgres saltea RLS entero.

\set ON_ERROR_STOP on
set client_min_messages = warning;

-- Arma una partida en juego y guarda los datos que necesitamos.
create temp table ctx as
select gid, ids from t_setup('relampago') as t(gid, ids);

do $$
declare gid uuid; ids uuid[];
begin
  select c.gid, c.ids into gid, ids from ctx c;
  perform t_as(ids[1]);
  perform open_voting(gid);
end $$;

create temp table peek as
select (select gid from ctx) as gid,
       (select ids from ctx) as ids,
       card_author((select gid from ctx), 0) as subject;

-- Tabla secreta bien tapada = permiso denegado O cero filas. Las dos sirven.
create or replace function t_leaks(p_table text) returns int
language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from ' || p_table into n;
  return n;
exception when insufficient_privilege then return 0;
end $$;
grant execute on function t_leaks(text) to authenticated;

grant select on ctx, peek to authenticated;

-- A partir de aca, cliente real: rol authenticated + JWT de un jugador.
select t_as((select ids[2] from ctx));
set role authenticated;

do $$
declare n int; gid uuid := (select gid from peek);
begin
  n := t_leaks('entries');
  assert n = 0, 'entries expuso ' || n || ' filas al cliente';

  n := t_leaks('game_secrets');
  assert n = 0, 'game_secrets expuso ' || n || ' filas (revelaria el orden de las cartas)';

  n := t_leaks('guesses');
  assert n = 0, 'guesses expuso ' || n || ' filas';

  n := t_leaks('chain_turns');
  assert n = 0, 'chain_turns expuso ' || n || ' filas';

  -- Lo que si tiene que poder leer para sincronizar por Realtime.
  select count(*) into n from games where id = gid;
  assert n = 1, 'el jugador debe poder leer su propia partida';
  select count(*) into n from players where game_id = gid;
  assert n = 4, 'el jugador debe ver la lista de jugadores, vio ' || n;

  raise notice 'RLS de tablas ok';
end $$;

-- Los helpers internos no pueden ser invocables: cada uno filtra el secreto.
do $$
declare gid uuid := (select gid from peek); leaked text := '';
begin
  begin perform card_author(gid, 0);            leaked := leaked || 'card_author ';    exception when others then null; end;
  begin perform card_steps(gid, 1);             leaked := leaked || 'card_steps ';     exception when others then null; end;
  begin perform participants(gid);              leaked := leaked || 'participants ';   exception when others then null; end;
  begin perform my_player(gid);                 leaked := leaked || 'my_player ';      exception when others then null; end;
  begin perform round_count(gid);               leaked := leaked || 'round_count ';    exception when others then null; end;
  begin perform blind_candidates(gid, gen_random_uuid()); leaked := leaked || 'blind_candidates '; exception when others then null; end;
  begin perform close_round(gid, 0);            leaked := leaked || 'close_round ';    exception when others then null; end;
  begin perform build_chain(gid, 0);            leaked := leaked || 'build_chain ';    exception when others then null; end;
  begin perform podium(gid);                    leaked := leaked || 'podium ';         exception when others then null; end;

  assert leaked = '', 'el cliente pudo ejecutar helpers internos: ' || leaked;
  raise notice 'helpers internos protegidos ok';
end $$;

-- La RPC publica si tiene que andar, y sin revelar el autor durante la votacion.
do $$
declare st jsonb; gid uuid := (select gid from peek);
begin
  st := get_game_state(gid);
  assert st #>> '{game,status}' = 'playing', 'get_game_state debe funcionar para el jugador';
  assert st #>> '{round,author_id}' is null, 'get_game_state filtro el autor durante la votacion';
  assert jsonb_array_length(st #> '{round,steps}') > 0, 'el jugador debe ver los datos de la carta';
  raise notice 'get_game_state ok';
end $$;

reset role;
select 'RLS OK' as resultado;
