import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifySmToken } from "@/lib/sm-auth";
import { touchRoomActivity } from "@/lib/activity";
import { broadcastRoomEvent } from "@/lib/realtime/broadcast-server";
import { CreateRoundRequestSchema, type CreateRoundResponse } from "@/types/api";
import type { RoundMirror } from "@/types/realtime";

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

  // Sem tabela de rounds, não há mais "rodada atual" pro servidor conferir
  // (revote/próximo ticket são só uma nova rodada — o client já garante na
  // UI que só oferece isso depois do reveal).
  const round: RoundMirror = {
    id: randomUUID(),
    ticketCode: parsed.data.ticketCode,
    status: "voting",
    createdAt: new Date().toISOString(),
    revealedAt: null,
  };

  await touchRoomActivity(roomId);
  await broadcastRoomEvent(roomId, { type: "round_started", round });

  const response: CreateRoundResponse = { round };
  return NextResponse.json(response, { status: 201 });
}
