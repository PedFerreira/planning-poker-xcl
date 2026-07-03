# Multi-stage build usando o output "standalone" do Next.js (next.config.ts).
# Pensado para rodar ao lado de uma stack self-hosted do Supabase — veja o
# guia de deploy self-hosted no README.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* precisam ser os valores reais: ficam embutidos no bundle do
# browser durante o build e não podem ser trocados depois em runtime.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1
# Só precisa existir pra passar na validação em lib/supabase/server.ts (que
# roda no carregamento do módulo); nunca é embutido no bundle do browser —
# o valor de verdade é injetado em runtime (docker run -e / compose),
# nunca aqui no build.
ENV SUPABASE_SERVICE_ROLE_KEY=build-placeholder

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
