-- El deadline de cada fase es un timestamp del servidor, pero la cuenta regresiva
-- la dibuja el telefono. Si su reloj esta corrido, el jugador ve "quedan 20s"
-- mientras el servidor ya le rechaza el voto por vencido.
--
-- El cliente llama esto una vez y se guarda el offset. Una funcion chica en vez
-- de meter now() dentro de get_game_state, que obligaria a duplicarla entera.
create function server_now() returns timestamptz
language sql stable as $$ select now() $$;

grant execute on function server_now() to anon, authenticated;
