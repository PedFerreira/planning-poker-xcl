import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { VoteStatusResponse } from "@/types/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;
  const participantId = new URL(request.url).searchParams.get("participantId");

  if (!participantId) {
    return NextResponse.json({ error: "participantId é obrigatório" }, { status: 400 });
  }

  const { data } = await supabaseServer
    .from("votes")
    .select("participant_id")
    .eq("round_id", roundId)
    .eq("participant_id", participantId)
    .maybeSingle();

  const response: VoteStatusResponse = { hasVoted: Boolean(data) };
  return NextResponse.json(response);
}
