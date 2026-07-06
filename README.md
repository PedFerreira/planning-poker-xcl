# Planning Poker XCL

Ferramenta interna de estimativa colaborativa (Planning Poker) para times
ágeis da XCL. Múltiplos Scrum Masters podem rodar sessões em paralelo, cada
uma em uma sala isolada, sem necessidade de login.

Stack: Next.js (App Router) + Supabase (Postgres + Realtime) + Zustand +
Tailwind/shadcn. Deploy recomendado no free tier (Vercel Hobby + Supabase
Free), com caminho de migração para self-hosted (Docker Compose do Supabase
+ build standalone do Next.js) documentado abaixo em "Deploy".

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
- [x] **Fase 5 — Polimento.** Monograma "XCL" no verso da carta
      (`components/room/Card.tsx`); `DeckFooter` passa a rolar na horizontal
      em vez de quebrar linha — no celular o baralho (11 cartas) cobria a
      mesa inteira antes desse ajuste; `useRoomChannel` passa a expor
      `connectionStatus` (`connecting`/`connected`/`disconnected`) via o
      status do `channel.subscribe`, com `ConnectionBanner` exibido quando
      não conectado; ao reconectar após queda, `resyncRound` busca o estado
      atual da rodada (`GET /api/rooms/[roomId]/round`, via
      `lib/room-state.ts` — extraído e reaproveitado da leitura SSR da
      página da sala) pra cobrir qualquer broadcast perdido offline; guia de
      deploy no README (Vercel + Supabase recomendado; self-hosted via
      `Dockerfile` com build `standalone` do Next.js + Docker Compose
      oficial do Supabase). Paleta/identidade seguem placeholder (ver
      Fase 2) — cores e logo oficiais da XCL, quando chegarem, trocam só em
      `app/globals.css` e `components/layout/Logo.tsx`.
      *Critério de saída verificado ponta a ponta:* build/typecheck/lint
      limpos; viewport de celular (375px) sem overflow horizontal e sem a
      mesa coberta pelo baralho; teste com dois browser contexts isolados
      alternando `setOffline(true/false)` mostra o banner de reconexão e,
      ao voltar, resincroniza corretamente o reveal que o client perdeu
      enquanto offline (cartas e estatísticas idênticas às do client que
      ficou online o tempo todo).
      Limite conhecido: o self-hosted não foi testado contra uma stack
      Supabase real rodando localmente (sem Docker disponível neste
      ambiente) — o `Dockerfile` segue o padrão oficial de `output:
      'standalone'` do Next.js, mas só o build (`npm run build`) foi
      verificado, não o `docker build`/`docker run` em si.
- [x] **Fase 6 — Redução de dados trafegados.** Após o app já estar em
      produção (deploy na Vercel em 2026-07-06), removidos os campos de link
      do ticket (Jira) e descrição da história — tanto do formulário de
      criação de sala/próximo ticket quanto da API e do schema do banco
      (`supabase/migrations/0002_remove_ticket_url_description.sql`, que
      também remove `ticket_title`, coluna que desde a Fase 1 só espelhava
      `ticket_code` em todo insert e nunca era lida de volta). O campo
      "Ticket do Jira" (`ticketCode`) passou de 60 para 15 caracteres. Isso
      torna moot a mitigação de XSS via link do ticket descrita abaixo em
      "Corrigido nesta revisão" — o vetor deixou de existir porque o campo
      não existe mais, não porque a validação melhorou.
      **Ação pendente:** rodar `supabase/migrations/0002_remove_ticket_url_description.sql`
      no SQL Editor do projeto Supabase de produção — `drop column` é
      destrutivo, sem rollback automático.

## Segurança

Revisão de segurança feita antes da apresentação do projeto, cobrindo o
código-fonte completo (não é uma skill/ferramenta automatizada — foi uma
auditoria manual guiada por OWASP Top 10, gestão de segredos e o modelo de
ameaça específico deste app).

### Corrigido nesta revisão

- **XSS via link do ticket.** `ticketUrl` era validado só com `z.string().url()`,
  que aceita qualquer esquema — inclusive `javascript:` — e era renderizado
  direto como `<a href>` em `RoomHeader`. Como qualquer pessoa cria uma sala
  sem login, isso era um vetor de XSS/roubo do token de Scrum Master
  explorável por qualquer um. Corrigido nesta revisão em duas camadas
  (validação `https` + allowlist de host, e um guard de defesa em
  profundidade em `RoomHeader.tsx`); na Fase 6 o campo foi removido do app
  por completo (ver "Status do projeto" acima), então hoje o vetor nem
  existe mais.
- **Content-Security-Policy e headers de segurança.** Adicionados em
  `next.config.ts`: CSP (restringe scripts/estilos/conexões a `'self'` + host
  do Supabase), `X-Frame-Options: DENY` / `frame-ancestors 'none'`
  (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy` e `Strict-Transport-Security`.

### Riscos aceitos (baixo impacto dado o objetivo funcional da ferramenta)

Nenhum dado sensível trafega pelo app (só nome, cargo e voto de estimativa,
sem login/PII). Os pontos abaixo foram identificados na revisão mas não
corrigidos agora por não colocarem em risco dados sensíveis nem o sistema
como um todo — documentados aqui para referência futura:

- Participante consegue votar/retirar voto de outro participante da mesma
  sala (o `participantId` é visível via Presence a todos da sala; os
  endpoints de voto não verificam posse). Afeta só a integridade da estimativa
  dentro de uma sessão, não expõe dado de fora dela.
- Eventos de Realtime (`round_started`, `cards_revealed`, etc.) são aceitos
  pelo client com checagem de formato (Zod) mas sem verificar se vieram
  mesmo do servidor — ver seção "Configuração adicional no Supabase" abaixo
  para o caminho de correção, se decidirem endurecer isso no futuro.
- Sem rate limiting em `/api/rooms` (criação de sala) — permite spam de
  salas/rounds por um script, sem autenticação.
- Token de Scrum Master fica em `localStorage` (não expira ao fechar a aba).

### Configuração adicional recomendada no Supabase

Nenhuma é obrigatória para o app funcionar — são endurecimentos adicionais
possíveis no projeto Supabase, fora do escopo do código:

- **Realtime Authorization (canais privados).** Hoje o canal
  `room:{roomId}` é público: qualquer cliente com a anon key (pública, vai no
  bundle do browser) pode se conectar e, em tese, publicar eventos forjados
  nele — não há autenticação de participante, só de Scrum Master via
  `x-sm-token` nas rotas de API. Dá pra reduzir isso configurando canais como
  `private: true` + policies de RLS na tabela `realtime.messages` (ver
  [docs do Supabase sobre Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)).
  Como este app não usa Supabase Auth (não há login), a policy de RLS não
  consegue diferenciar participantes entre si — o ganho seria bloquear
  clientes totalmente fora do app, não impersonação entre participantes da
  mesma sala. Requer mudança de código além da config; me avisem se quiserem
  que eu implemente.
- **Limpeza automática de salas antigas.** Já é um risco em aberto anotado
  no plano original (ver "Status do projeto" acima) — configurar `pg_cron` no
  Postgres do Supabase (ou Vercel Cron, se for esse o host) pra apagar salas
  com `last_activity_at` > 1 hora de inatividade reduz a superfície de dados
  (código do ticket, nomes) retidos indefinidamente. Complementar a isso, o
  Scrum Master também deve poder encerrar a sala manualmente ao fim da
  sessão — nenhum dos dois está implementado ainda.
- **Network Restrictions** (disponível em planos pagos do Supabase): restringe
  o acesso ao Postgres por IP — relevante se o app for hospedado com IP fixo
  (ex.: atrás de um proxy corporativo).
- Confirmar que a `SUPABASE_SERVICE_ROLE_KEY` de produção fica só no cofre de
  secrets da plataforma de hosting (Vercel Environment Variables ou
  equivalente interno), nunca em chat/e-mail — o `Dockerfile` já garante que
  ela não é embutida na imagem de build (ver comentário nele).

### Pontos que dependem de política da empresa — levar ao time de segurança

Estes pontos não são visíveis a partir só deste repositório; surgiram na
discussão sobre hospedar o app num subdomínio da XCL e dependem de como a
infraestrutura da empresa é configurada como um todo. Antes de publicar em
produção num subdomínio corporativo, vale confirmar com o time de segurança:

- **Escopo de cookies do domínio pai.** Se algum outro sistema da empresa usa
  cookies com `Domain=.xcl.digital` (SSO, intranet, etc.) sem `HttpOnly`, um
  XSS neste app (mesmo que hoje mitigado) poderia, em tese, ler/usar cookies
  de sessão de outros sistemas — o raio de ação de uma falha aqui deixa de
  ser só este app.
- **Confiança em wildcard de subdomínio.** Verificar se outros apps em
  `*.xcl.digital` usam `document.domain` relaxado ou CSP/CORS que confiam no
  domínio pai inteiro — isso tornaria este app um pivô possível contra eles
  se comprometido.
- **Higiene de DNS / subdomain takeover.** Quando este app for desativado ou
  trocar de hosting, remover o registro DNS (CNAME) do subdomínio — um
  registro "órfão" ainda apontando pra um provedor (Vercel, etc.) é um vetor
  clássico de takeover de subdomínio.
- **Sala compartilhável sem login como vetor de phishing interno.** O app
  permite a qualquer pessoa sem login criar uma sala e compartilhar o link —
  hospedado num domínio da empresa, isso aumenta a credibilidade percebida
  por quem recebe. Vale considerar se algum controle adicional (ex.: SSO na
  criação de sala) faz sentido dependendo de como o link será divulgado
  internamente. (O sub-ponto específico de link do ticket do Jira, citado
  aqui antes, não existe mais — ver Fase 6 em "Status do projeto".)

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

3. Rode as migrações, em ordem, no SQL Editor do projeto Supabase:
   `supabase/migrations/0001_init.sql` (cria as tabelas `rooms`, `rounds`,
   `votes` e as policies de RLS) e
   `supabase/migrations/0002_remove_ticket_url_description.sql` (remove os
   campos de link/descrição do ticket).

4. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

## Deploy

### Vercel + Supabase (recomendado)

É o caminho mais simples e o alvo original do projeto (free tier dos dois).

1. **Supabase**: crie o projeto (ou use um existente), rode
   `supabase/migrations/0001_init.sql` no SQL Editor e confirme em
   *Project Settings → API* que Realtime está habilitado (vem ligado por
   padrão — Presence e Broadcast não dependem de habilitar replicação em
   tabela nenhuma, só `postgres_changes` dependeria disso, e este projeto
   não usa).
2. **Vercel**: importe o repositório do GitHub
   (`https://github.com/PedFerreira/planning-poker-xcl`) — o framework
   Next.js é detectado automaticamente, nenhuma configuração de build é
   necessária (`next.config.ts` já define `output: 'standalone'`, que a
   Vercel usa nativamente).
3. Em *Project Settings → Environment Variables* na Vercel, adicione as
   três variáveis do `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) — a
   `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposta com o prefixo
   `NEXT_PUBLIC_`, e o projeto já garante isso: só `lib/supabase/server.ts`
   (marcado `server-only`) a importa.
4. Deploy automático a cada push em `main`. Não há cron configurado — a
   limpeza de salas antigas (>7 dias) descrita no plano ainda não foi
   implementada; ver seção "Riscos em aberto" do plano de arquitetura.

### Self-hosted (Docker Compose)

Para portar para infraestrutura própria: Supabase roda via o
Docker Compose oficial deles, e este app roda como um container separado a
partir do `Dockerfile` do repo (build `standalone` do Next.js).

1. **Suba o Supabase self-hosted** seguindo o guia oficial
   ([supabase.com/docs/guides/self-hosting/docker](https://supabase.com/docs/guides/self-hosting/docker)):
   clone `github.com/supabase/supabase`, copie `docker/.env.example` para
   `docker/.env`, gere os secrets (`JWT_SECRET`, `ANON_KEY`,
   `SERVICE_ROLE_KEY`, senha do Postgres) e suba com
   `docker compose up -d` dentro de `docker/`. Isso já sobe Postgres,
   Realtime, Kong (gateway/API), Studio etc.
2. Rode `supabase/migrations/0001_init.sql` deste repo contra o Postgres
   subido (via Studio, exposto por padrão em `http://localhost:8000`, ou
   `psql` direto).
3. **Build da imagem do app**, passando as chaves públicas como
   build args (elas ficam embutidas no bundle do browser, então precisam
   ser os valores reais no momento do build — diferente da
   `SUPABASE_SERVICE_ROLE_KEY`, que é lida em runtime e nunca embutida no
   client; o `Dockerfile` usa um placeholder no build por isso):

   ```bash
   docker build \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=http://<host-do-kong>:8000 \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-do-self-host> \
     -t planning-poker-xcl .
   ```

4. **Rode o container**, agora sim com a `SERVICE_ROLE_KEY` real (só em
   runtime, nunca commitada nem gravada na imagem):

   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=http://<host-do-kong>:8000 \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-do-self-host> \
     -e SUPABASE_SERVICE_ROLE_KEY=<service-role-key-do-self-host> \
     planning-poker-xcl
   ```

   Em produção, coloque este container na mesma rede Docker do Compose do
   Supabase (`docker network connect`) e/ou por trás de um reverse proxy
   (nginx/Caddy/Traefik) para TLS.
5. Limpeza de salas antigas: como não há Vercel Cron aqui, use `pg_cron`
   no Postgres ou um scheduler externo (`cron`/systemd timer) batendo numa
   rota `/api/admin/cleanup` protegida por secret — nenhuma das duas está
   implementada ainda, é trabalho futuro documentado no plano de arquitetura.

## Estrutura

```
config/decks.ts          # baralhos de votação (Fibonacci, Camisetas, Semáforo)
types/                    # tipos de domínio + zod schemas (API e realtime)
lib/                      # clients Supabase, ids, helpers
supabase/migrations/      # schema SQL
app/                      # rotas (landing, /sala/[roomId], API routes)
components/               # UI (shadcn em components/ui, features em create-room/ e room/)
Dockerfile, .dockerignore # build standalone do Next.js para self-hosted
```
