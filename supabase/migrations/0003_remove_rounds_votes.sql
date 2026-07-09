-- Remove a persistência de rodadas/votos: a partir desta migração, o estado
-- de rodada (ticket atual, status, quem votou e os valores) deixa de existir
-- no Postgres e passa a viver só no canal Realtime (Presence + Broadcast),
-- reconstruído a partir da presence de quem está conectado na sala. `rooms`
-- continua existindo — é identidade da sala (token do SM, deck, TTL de
-- inatividade), não "informação de votação".
drop trigger if exists votes_touch_room on votes;
drop trigger if exists rounds_touch_room on rounds;
drop function if exists touch_room_activity();
drop function if exists touch_room_activity_on_round();

drop table if exists votes;
drop table if exists rounds;

-- rooms e sua RLS (default-deny para anon) seguem sem alteração.
