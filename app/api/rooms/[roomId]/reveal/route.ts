import { NextResponse } from "next/server";
import { verifySmToken } from "@/lib/sm-auth";
import { touchRoomActivity } from "@/lib/activity";
import { broadcastRoomEvent } from "@/lib/realtime/broadcast-server";
import { RevealRequestSchema, type RevealResponse } from "@/types/api";

/**
 * O servidor nunca teve os valores dos votos (não há mais tabela pra lê-los
 * de volta) — este endpoint só autentica o Scrum Master e dispara o sinal
 * pro canal; cada client revela o próprio valor (guardado só localmente até
 * então) na própria presence ao receber o evento (ver
 * lib/realtime/use-room-channel.ts).
 */
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
  const parsed = RevealRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const revealedAt = new Date().toISOString();

  await touchRoomActivity(roomId);
  await broadcastRoomEvent(roomId, {
    type: "reveal_requested",
    roundId: parsed.data.roundId,
    revealedAt,
  });

  const response: RevealResponse = { revealedAt };
  return NextResponse.json(response);
}
