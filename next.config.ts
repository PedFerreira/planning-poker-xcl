import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// connect-src precisa liberar o host do Supabase (REST + Realtime via
// WebSocket) usado direto pelo browser (lib/supabase/client.ts). Derivado de
// NEXT_PUBLIC_SUPABASE_URL em vez de hardcoded pra funcionar tanto no
// Supabase Cloud (*.supabase.co) quanto self-hosted (host arbitrário — ver
// README, seção "Self-hosted").
function buildConnectSrc(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "'self'";
  try {
    const { origin } = new URL(supabaseUrl);
    const wsOrigin = origin.replace(/^http/, "ws");
    return `'self' ${origin} ${wsOrigin}`;
  } catch {
    return "'self'";
  }
}

// Sem nonces: o app não usa <Script> inline nem exige política de scripts tão
// restrita a ponto de justificar mudar todas as páginas pra dynamic rendering
// (custo de performance/caching descrito no guia de CSP do Next.js). Ver
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src ${buildConnectSrc()};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader.replace(/\s{2,}/g, " ").trim() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
