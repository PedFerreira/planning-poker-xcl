import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Room } from "@/types/domain";

/**
 * Único ponto de acesso à tabela `rooms` — identidade da sala (token do SM,
 * deck, TTL de inatividade). É a fronteira pensada para uma futura troca do
 * Postgres do Supabase por RDS/Aurora: só este arquivo muda.
 */

export async function createRoom(params: {
  id: string;
  projectName: string;
  scrumMasterName: string;
  deckType: string;
  scrumMasterToken: string;
}): Promise<boolean> {
  const { error } = await supabaseServer.from("rooms").insert({
    id: params.id,
    project_name: params.projectName,
    scrum_master_name: params.scrumMasterName,
    deck_type: params.deckType,
    scrum_master_token: params.scrumMasterToken,
  });
  return !error;
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const { data } = await supabaseServer
    .from("rooms")
    .select("id, project_name, scrum_master_name, deck_type, created_at")
    .eq("id", roomId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    projectName: data.project_name,
    scrumMasterName: data.scrum_master_name,
    deckType: data.deck_type,
    createdAt: data.created_at,
  };
}

export async function getScrumMasterToken(roomId: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("rooms")
    .select("scrum_master_token")
    .eq("id", roomId)
    .maybeSingle();

  return data?.scrum_master_token ?? null;
}

export async function deleteRoom(roomId: string): Promise<void> {
  await supabaseServer.from("rooms").delete().eq("id", roomId);
}

export async function listInactiveRoomIds(thresholdIso: string): Promise<string[]> {
  const { data } = await supabaseServer
    .from("rooms")
    .select("id")
    .lt("last_activity_at", thresholdIso);

  return (data ?? []).map((row) => row.id);
}
