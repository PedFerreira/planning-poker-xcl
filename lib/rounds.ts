import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { RoundStatus } from "@/types/domain";

export type RoundForVoting = {
  id: string;
  roomId: string;
  status: RoundStatus;
  deckType: string;
};

export async function getRoundForVoting(roundId: string): Promise<RoundForVoting | null> {
  const { data: round } = await supabaseServer
    .from("rounds")
    .select("id, room_id, status")
    .eq("id", roundId)
    .maybeSingle();

  if (!round) return null;

  const { data: room } = await supabaseServer
    .from("rooms")
    .select("deck_type")
    .eq("id", round.room_id)
    .maybeSingle();

  if (!room) return null;

  return {
    id: round.id,
    roomId: round.room_id,
    status: round.status,
    deckType: room.deck_type,
  };
}
