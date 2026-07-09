import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Sem tabelas de rounds/votes, não existe mais write nelas pra disparar um
 * trigger de "última atividade" — esta função é chamada explicitamente pelas
 * rotas que representam atividade real na sala (heartbeat, nova rodada,
 * reveal). Best-effort: uma falha aqui não deve derrubar a requisição
 * chamadora.
 */
export async function touchRoomActivity(roomId: string): Promise<void> {
  await supabaseServer
    .from("rooms")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", roomId);
}
