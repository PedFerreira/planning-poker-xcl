-- Reduz a superfície de dados trafegados/armazenados: remove o link do
-- ticket (Jira) e a descrição livre da história. ticket_title também sai —
-- desde a Fase 1 ele sempre espelhava ticket_code em todo insert (ver
-- app/api/rooms/route.ts e app/api/rooms/[roomId]/rounds/route.ts) e nunca
-- era lido de volta em lugar nenhum, então já era dado morto antes mesmo
-- desta mudança.
alter table rounds
  drop column ticket_url,
  drop column ticket_description,
  drop column ticket_title;
