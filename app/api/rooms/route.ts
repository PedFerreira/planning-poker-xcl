import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateRoomId, generateScrumMasterToken } from "@/lib/ids";
import { CreateRoomRequestSchema, type CreateRoomResponse } from "@/types/api";

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

  const { error: roomError } = await supabaseServer.from("rooms").insert({
    id: roomId,
    project_name: projectName,
    scrum_master_name: scrumMasterName,
    deck_type: deckType,
    scrum_master_token: scrumMasterToken,
  });

  if (roomError) {
    return NextResponse.json(
      { error: "Não foi possível criar a sala" },
      { status: 500 }
    );
  }

  const { error: roundError } = await supabaseServer.from("rounds").insert({
    room_id: roomId,
    round_number: 1,
    ticket_code: ticketCode,
  });

  if (roundError) {
    await supabaseServer.from("rooms").delete().eq("id", roomId);
    return NextResponse.json(
      { error: "Não foi possível criar a primeira rodada" },
      { status: 500 }
    );
  }

  const response: CreateRoomResponse = { roomId, scrumMasterToken };
  return NextResponse.json(response, { status: 201 });
}
