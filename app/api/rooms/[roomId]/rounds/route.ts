import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifySmToken } from "@/lib/sm-auth";
import { broadcastRoomEvent } from "@/lib/realtime/broadcast-server";
import { CreateRoundRequestSchema, type CreateRoundResponse } from "@/types/api";
import type { RoundPublic } from "@/types/realtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const authorized = await verifySmToken(roomId, request.headers.get("x-sm-token"));
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateRoundRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: currentRound } = await supabaseServer
    .from("rounds")
    .select("round_number, status, ticket_code")
    .eq("room_id", roomId)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!currentRound) {
    return NextResponse.json({ error: "Sala sem rodadas" }, { status: 404 });
  }
  if (currentRound.status !== "revealed") {
    return NextResponse.json(
      { error: "A rodada atual ainda não foi revelada" },
      { status: 400 }
    );
  }

  const insert =
    parsed.data.mode === "revote"
      ? { ticket_code: currentRound.ticket_code }
      : { ticket_code: parsed.data.ticketCode };

  const { data: newRound, error } = await supabaseServer
    .from("rounds")
    .insert({
      room_id: roomId,
      round_number: currentRound.round_number + 1,
      ...insert,
    })
    .select("id, room_id, round_number, ticket_code, status, created_at, revealed_at")
    .single();

  if (error || !newRound) {
    return NextResponse.json({ error: "Não foi possível criar a rodada" }, { status: 500 });
  }

  const round: RoundPublic = {
    id: newRound.id,
    roomId: newRound.room_id,
    roundNumber: newRound.round_number,
    ticketCode: newRound.ticket_code,
    status: newRound.status,
    // Supabase retorna timestamptz como "...+00:00"; RoundPublicSchema exige
    // o formato "...Z" (z.string().datetime() sem offset), senão o parse
    // falha em silêncio no cliente e o broadcast nunca chega.
    createdAt: new Date(newRound.created_at).toISOString(),
    revealedAt: newRound.revealed_at ? new Date(newRound.revealed_at).toISOString() : null,
  };

  await broadcastRoomEvent(roomId, { type: "round_started", round });

  const response: CreateRoundResponse = { round };
  return NextResponse.json(response, { status: 201 });
}
