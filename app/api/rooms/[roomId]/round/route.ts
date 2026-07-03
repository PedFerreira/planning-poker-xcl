import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentRoundState } from "@/lib/room-state";
import type { CurrentRoundResponse } from "@/types/api";

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

  const round = await getCurrentRoundState(roomId, room.deck_type);
  if (!round) {
    return NextResponse.json({ error: "Sala sem rodadas" }, { status: 404 });
  }

  const response: CurrentRoundResponse = {
    id: round.id,
    status: round.status,
    ticketCode: round.ticketCode,
    ticketUrl: round.ticketUrl,
    votes: round.votes,
    stats: round.stats,
  };
  return NextResponse.json(response);
}
