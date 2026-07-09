import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";
import { generateRoomId, generateScrumMasterToken } from "@/lib/ids";
import { CreateRoomRequestSchema, type CreateRoomResponse } from "@/types/api";
import type { RoundMirror } from "@/types/realtime";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateRoomRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { projectName, scrumMasterName, deckType, ticketCode } = parsed.data;

  const roomId = generateRoomId();
  const scrumMasterToken = generateScrumMasterToken();

  const created = await createRoom({
    id: roomId,
    projectName,
    scrumMasterName,
    deckType,
    scrumMasterToken,
  });

  if (!created) {
    return NextResponse.json(
      { error: "Não foi possível criar a sala" },
      { status: 500 }
    );
  }

  // Rodada 1 nunca é gravada em banco nem transmitida por broadcast (o SM
  // ainda nem abriu o canal Realtime neste momento — perderia o evento).
  // Vai só na resposta; o client guarda em lib/round-cache.ts e usa pra
  // inicializar o estado local ao entrar na sala.
  const round: RoundMirror = {
    id: randomUUID(),
    ticketCode,
    status: "voting",
    createdAt: new Date().toISOString(),
    revealedAt: null,
  };

  const response: CreateRoomResponse = { roomId, scrumMasterToken, round };
  return NextResponse.json(response, { status: 201 });
}
