import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getRoundForVoting } from "@/lib/rounds";
import { verifySmToken } from "@/lib/sm-auth";
import { computeVoteStats } from "@/lib/stats";
import { broadcastRoomEvent } from "@/lib/realtime/broadcast-server";
import type { RevealResponse } from "@/types/api";
import type { RevealedVote } from "@/types/domain";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;

  const round = await getRoundForVoting(roundId);
  if (!round) {
    return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
  }

  const authorized = await verifySmToken(round.roomId, request.headers.get("x-sm-token"));
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (round.status !== "voting") {
    return NextResponse.json({ error: "A rodada já foi revelada" }, { status: 400 });
  }

  const { data: voteRows, error: votesError } = await supabaseServer
    .from("votes")
    .select("participant_id, participant_name, participant_role, card_value")
    .eq("round_id", roundId);

  if (votesError) {
    return NextResponse.json({ error: "Não foi possível ler os votos" }, { status: 500 });
  }

  const revealedAt = new Date().toISOString();

  const { error: updateError } = await supabaseServer
    .from("rounds")
    .update({ status: "revealed", revealed_at: revealedAt })
    .eq("id", roundId);

  if (updateError) {
    return NextResponse.json({ error: "Não foi possível revelar a rodada" }, { status: 500 });
  }

  const votes: RevealedVote[] = (voteRows ?? []).map((row) => ({
    participantId: row.participant_id,
    participantName: row.participant_name,
    participantRole: row.participant_role,
    cardValue: row.card_value,
  }));

  const stats = computeVoteStats(
    round.deckType,
    votes.map((v) => ({ cardValue: v.cardValue }))
  );

  await broadcastRoomEvent(round.roomId, {
    type: "cards_revealed",
    roundId,
    revealedAt,
    votes,
    stats,
  });

  const response: RevealResponse = { revealedAt, votes, stats };
  return NextResponse.json(response);
}
