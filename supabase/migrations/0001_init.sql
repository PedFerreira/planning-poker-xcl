-- Planning Poker XCL — schema inicial
create extension if not exists pgcrypto;

create table rooms (
  id                 text primary key,
  project_name       text not null,
  scrum_master_name  text not null,
  deck_type          text not null,
  scrum_master_token text not null,
  created_at         timestamptz not null default now(),
  last_activity_at   timestamptz not null default now()
);

create table rounds (
  id                  uuid primary key default gen_random_uuid(),
  room_id             text not null references rooms(id) on delete cascade,
  round_number        integer not null,
  ticket_code         text not null,
  ticket_url          text,
  ticket_title        text not null,
  ticket_description  text,
  status              text not null default 'voting' check (status in ('voting','revealed')),
  created_at          timestamptz not null default now(),
  revealed_at         timestamptz,
  unique (room_id, round_number)
);
create index rounds_room_id_idx on rounds (room_id);
create index rounds_room_status_idx on rounds (room_id, status);

create table votes (
  id                 uuid primary key default gen_random_uuid(),
  round_id           uuid not null references rounds(id) on delete cascade,
  participant_id     text not null,
  participant_name   text not null,
  participant_role   text not null,
  card_value         text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (round_id, participant_id)
);
create index votes_round_id_idx on votes (round_id);

-- mantém rooms.last_activity_at atualizado (usado por uma futura limpeza de salas >7 dias)
create or replace function touch_room_activity() returns trigger as $$
begin
  update rooms set last_activity_at = now() where id = (
    select room_id from rounds where id = coalesce(new.round_id, old.round_id)
  );
  return new;
end; $$ language plpgsql;
create trigger votes_touch_room after insert or update on votes
  for each row execute function touch_room_activity();

create or replace function touch_room_activity_on_round() returns trigger as $$
begin
  update rooms set last_activity_at = now() where id = new.room_id;
  return new;
end; $$ language plpgsql;
create trigger rounds_touch_room after insert or update on rounds
  for each row execute function touch_room_activity_on_round();

-- RLS: defesa em profundidade. A autorização primária é feita pelos Route
-- Handlers do Next.js usando a service-role key (que ignora RLS). Estas
-- policies protegem contra leitura direta via anon key/PostgREST, hoje
-- usada apenas pelo canal Realtime.
alter table rooms  enable row level security;
alter table rounds enable row level security;
alter table votes  enable row level security;

-- rooms: nenhuma policy para anon -> default-deny. scrum_master_token nunca
-- é legível via anon key. Toda leitura pública de sala passa por
-- GET /api/rooms/[roomId] (service role, que remove o token da resposta).

create policy rounds_select_anon on rounds for select to anon using (true);
grant select on rounds to anon;

-- votes: valor do voto nunca legível pré-reveal, mesmo via PostgREST direto.
create policy votes_select_revealed_only on votes for select to anon
  using (exists (select 1 from rounds r where r.id = votes.round_id and r.status = 'revealed'));
grant select on votes to anon;

-- Sem policies de insert/update/delete para anon: todo write passa pelos
-- Route Handlers com a service-role key.
