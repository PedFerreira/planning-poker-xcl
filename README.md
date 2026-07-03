# Planning Poker XCL

Ferramenta interna de estimativa colaborativa (Planning Poker) para times
ágeis da XCL. Múltiplos Scrum Masters podem rodar sessões em paralelo, cada
uma em uma sala isolada, sem necessidade de login.

Stack: Next.js (App Router) + Supabase (Postgres + Realtime) + Zustand +
Tailwind/shadcn. Deploy inicial no free tier (Vercel Hobby + Supabase Free),
com portabilidade planejada para self-hosted (Docker Compose + Next standalone).

O plano completo de arquitetura está em `C:\Users\pferr\.claude\plans\polished-launching-hanrahan.md`.

## Status do projeto

- [x] **Fase 0 — Plano.** Arquitetura, schema, contratos de eventos e ordem
      de implementação definidos e aprovados.
- [x] **Fase 1 — Fundação.** Projeto Next.js + Tailwind + shadcn/ui;
      Supabase configurado (`.env.local`); schema aplicado
      (`supabase/migrations/0001_init.sql`); `config/decks.ts`; criação de
      sala funcionando (`POST /api/rooms` → redirect para `/sala/{roomId}`
      com token de Scrum Master capturado e removido da URL). Verificado
      ponta a ponta (build, typecheck, lint e navegador real).
- [x] **Fase 2 — Sala e presença.** Form de entrada (nome/cargo, incl.
      "Outro"); identidade persistida em `sessionStorage` por sala
      (`lib/identity.ts` + `store/useIdentityStore.ts`); mesa renderizando
      participantes via Supabase Presence em tempo real
      (`lib/realtime/channel.ts`, `lib/realtime/use-room-channel.ts`,
      `components/room/VotingTable.tsx`); identidade visual placeholder da
      XCL aplicada nos tokens de tema (`app/globals.css`) e no header
      (`components/layout/`), adiantada da Fase 5 para já dar uma cara
      "de produto" sem gerar retrabalho. Verificado ponta a ponta (build,
      typecheck, lint e duas abas reais no navegador: entrada, presença em
      tempo real entre abas e persistência de identidade no refresh).
      Paleta é placeholder — trocar por cores/logo oficiais da XCL quando
      disponíveis é uma troca pontual em `app/globals.css` e
      `components/layout/Logo.tsx`.
- [x] **Fase 3 — Votação.** `DeckFooter` + `Card` (flip 3D em CSS puro, sem
      JS orquestrando estado — anima via `@keyframes` no mount);
      seleção/retirada de voto (`POST`/`DELETE /api/rounds/[roundId]/votes`,
      upsert, rejeita `Observador` e cartas fora do baralho); destaque da
      própria carta restaurado via `sessionStorage`
      (`lib/vote-storage.ts`) sem nunca trafegar o valor pelo servidor;
      `GET /vote-status` autoritativo (só `{hasVoted}`); reveal restrito ao
      Scrum Master (`lib/sm-auth.ts`, `x-sm-token`) com cálculo de stats
      (`lib/stats.ts`) e broadcast via REST (`channel.httpSend`, sem precisar
      manter socket aberto no Route Handler — resolve o risco em aberto da
      Fase 0); `ResultsPanel` com distribuição, média/mediana/mín/máx
      (só Fibonacci) e indicador de consenso, seguindo o padrão de série
      única de uma cor da skill de dataviz.
      *Critério de saída verificado ponta a ponta (build, typecheck, lint e
      duas abas reais, cada uma em um browser context isolado):*
      `cardValue` nunca aparece no DOM nem em resposta de API antes do
      reveal; `curl`/fetch sem `x-sm-token` (e com token errado) no reveal
      retornam 403; cartas reveladas e estatísticas idênticas nos dois
      clients via broadcast realtime.
- [x] **Fase 4 — Rodadas e histórico.** `POST /api/rooms/[roomId]/rounds`
      (SM, `{mode:'revote'}` mesmo ticket / `{mode:'next', ticket...}` ticket
      novo) sempre cria uma nova linha em `rounds`, exige a rodada atual já
      revelada e faz broadcast `round_started`; ao receber o evento, cada
      client reseta localmente sua própria seleção/`hasVoted` (a mesa é
      Postgres-first, presence é auto-reportada); `RoomHeader` atualiza o
      ticket ao vivo via estado, não mais via prop estática;
      `GET /api/rooms/[roomId]/history` + `RoundHistory` listam as rodadas
      já reveladas com resumo (consenso ou média/mediana ou distribuição).
      *Critério de saída verificado ponta a ponta (build, typecheck, lint e
      duas abas em contexts isolados):* "Nova rodada" reseta o estado de
      votação nos dois clients mantendo a rodada anterior no histórico;
      "Próximo ticket" atualiza o header ao vivo em ambos; histórico lista
      as rodadas na ordem certa com os stats corretos.
      Bug real encontrado e corrigido nessa fase: o `created_at`/`revealed_at`
      que o Supabase devolve vem como `...+00:00`, formato que o Zod
      `z.string().datetime()` rejeita silenciosamente (sem lançar erro
      visível) — o evento `round_started` nunca chegava ao segundo
      participante até normalizar para `.toISOString()` antes do broadcast.
- [ ] **Fase 5 — Polimento.** Identidade visual XCL completa, layout
      responsivo, estados de erro/reconexão do canal Realtime, guia de
      deploy (Vercel/Supabase) e migração self-hosted.

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha com as credenciais do
   seu projeto Supabase (Project Settings → API):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. Rode a migração `supabase/migrations/0001_init.sql` no SQL Editor do
   projeto Supabase (cria as tabelas `rooms`, `rounds`, `votes` e as
   policies de RLS).

4. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

```
config/decks.ts          # baralhos de votação (Fibonacci, Camisetas, Semáforo)
types/                    # tipos de domínio + zod schemas (API e realtime)
lib/                      # clients Supabase, ids, helpers
supabase/migrations/      # schema SQL
app/                      # rotas (landing, /sala/[roomId], API routes)
components/               # UI (shadcn em components/ui, features em create-room/ e room/)
```
