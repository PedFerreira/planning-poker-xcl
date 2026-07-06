import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { computeVoteStats } from "@/lib/stats";
import type { RoomHistoryResponse } from "@/types/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const { data: room } = await supabaseServer
    .from("rooms")
    .select("deck_type")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const { data: rounds } = await supabaseServer
    .from("rounds")
    .select("id, round_number, ticket_code, revealed_at")
    .eq("room_id", roomId)
    .eq("status", "revealed")
    .order("round_number", { ascending: false });

  const entries = await Promise.all(
    (rounds ?? []).map(async (round) => {
      const { data: voteRows } = await supabaseServer
        .from("votes")
        .select("card_value")
        .eq("round_id", round.id);

      const stats = computeVoteStats(
        room.deck_type,
        (voteRows ?? []).map((v) => ({ cardValue: v.card_value }))
      );

      return {
        id: round.id,
        roundNumber: round.round_number,
        ticketCode: round.ticket_code,
        revealedAt: new Date(round.revealed_at as string).toISOString(),
        stats,
      };
    })
  );

  const response: RoomHistoryResponse = { rounds: entries };
  return NextResponse.json(response);
}
