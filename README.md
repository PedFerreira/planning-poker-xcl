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
- [ ] **Fase 2 — Sala e presença.** Form de entrada (nome/cargo), identidade
      persistida em sessionStorage, mesa renderizando participantes via
      Supabase Presence em tempo real.
- [ ] **Fase 3 — Votação.** Baralho no rodapé, seleção de carta, estado
      "votou" na mesa, reveal restrito ao Scrum Master com flip 3D e painel
      de resultados (distribuição, média/mediana, consenso).
- [ ] **Fase 4 — Rodadas e histórico.** Revotação ("Nova rodada"), "Próximo
      ticket", histórico de rodadas reveladas na sala.
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
