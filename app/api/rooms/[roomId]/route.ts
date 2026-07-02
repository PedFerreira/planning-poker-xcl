import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { Room } from "@/types/domain";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const { data, error } = await supabaseServer
    .from("rooms")
    .select("id, project_name, scrum_master_name, deck_type, created_at")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar a sala" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const room: Room = {
    id: data.id,
    projectName: data.project_name,
    scrumMasterName: data.scrum_master_name,
    deckType: data.deck_type,
    createdAt: data.created_at,
  };

  return NextResponse.json(room);
}
