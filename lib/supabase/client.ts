import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente."
  );
}

/**
 * Client com a chave anon — usado no browser só para Realtime
 * (Presence + Broadcast). Nunca usado para ler/escrever tabelas diretamente.
 */
export const supabaseClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});
