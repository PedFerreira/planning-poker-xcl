import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getRoundForVoting } from "@/lib/rounds";
import { isValidCardValue } from "@/config/decks";
import { broadcastRoomEvent } from "@/lib/realtime/broadcast-server";
import {
  CastVoteRequestSchema,
  RetractVoteRequestSchema,
} from "@/types/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = CastVoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { participantId, participantName, participantRole, cardValue } = parsed.data;

  const round = await getRoundForVoting(roundId);
  if (!round) {
    return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
  }
  if (round.status !== "voting") {
    return NextResponse.json({ error: "A rodada já foi revelada" }, { status: 400 });
  }
  if (participantRole === "Observador") {
    return NextResponse.json(
      { error: "Observadores não podem votar" },
      { status: 403 }
    );
  }
  if (!isValidCardValue(round.deckType, cardValue)) {
    return NextResponse.json({ error: "Carta inválida para este baralho" }, { status: 400 });
  }

  const { error } = await supabaseServer.from("votes").upsert(
    {
      round_id: roundId,
      participant_id: participantId,
      participant_name: participantName,
      participant_role: participantRole,
      card_value: cardValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "round_id,participant_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Não foi possível registrar o voto" }, { status: 500 });
  }

  await broadcastRoomEvent(round.roomId, {
    type: "vote_cast",
    roundId,
    participantId,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = RetractVoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { participantId } = parsed.data;

  const round = await getRoundForVoting(roundId);
  if (!round) {
    return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
  }
  if (round.status !== "voting") {
    return NextResponse.json({ error: "A rodada já foi revelada" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("votes")
    .delete()
    .eq("round_id", roundId)
    .eq("participant_id", participantId);

  if (error) {
    return NextResponse.json({ error: "Não foi possível retirar o voto" }, { status: 500 });
  }

  await broadcastRoomEvent(round.roomId, {
    type: "vote_retracted",
    roundId,
    participantId,
  });

  return NextResponse.json({ ok: true });
}
