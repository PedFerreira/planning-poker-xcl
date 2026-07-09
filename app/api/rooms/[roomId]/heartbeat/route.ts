import { NextResponse } from "next/server";
import { touchRoomActivity } from "@/lib/activity";

/**
 * Chamado periodicamente por qualquer client com a sala aberta (e depois de
 * ações-chave) pra manter `rooms.last_activity_at` vivo — sem writes em
 * votes/rounds (não existem mais), este é o único sinal de atividade que
 * impede o expurgo por inatividade de uma sessão de votação silenciosa.
 * Sem autenticação por design: roomId já é público (está no link
 * compartilhável) e não há dado sensível em jogo — ver README, "Riscos
 * aceitos".
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  await touchRoomActivity(roomId);
  return new NextResponse(null, { status: 204 });
}
