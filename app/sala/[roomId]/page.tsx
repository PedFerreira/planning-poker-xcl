import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getDeck } from "@/config/decks";
import { computeVoteStats } from "@/lib/stats";
import { ScrumMasterTokenCapture } from "@/components/room/ScrumMasterTokenCapture";
import { RoomClient } from "@/components/room/RoomClient";
import { Header } from "@/components/layout/Header";
import type { RevealedVote } from "@/types/domain";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const { data: room } = await supabaseServer
    .from("rooms")
    .select("id, project_name, scrum_master_name, deck_type")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    notFound();
  }

  const { data: round } = await supabaseServer
    .from("rounds")
    .select("id, status, ticket_code, ticket_url, ticket_title, ticket_description")
    .eq("room_id", roomId)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!round) {
    notFound();
  }

  const deck = getDeck(room.deck_type);

  let initialVotes: RevealedVote[] | null = null;
  let initialStats = null;
  if (round.status === "revealed") {
    const { data: voteRows } = await supabaseServer
      .from("votes")
      .select("participant_id, participant_name, participant_role, card_value")
      .eq("round_id", round.id);

    initialVotes = (voteRows ?? []).map((row) => ({
      participantId: row.participant_id,
      participantName: row.participant_name,
      participantRole: row.participant_role,
      cardValue: row.card_value,
    }));
    initialStats = computeVoteStats(
      room.deck_type,
      initialVotes.map((v) => ({ cardValue: v.cardValue }))
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Suspense fallback={null}>
        <ScrumMasterTokenCapture roomId={roomId} />
      </Suspense>
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <RoomClient
          roomId={roomId}
          projectName={room.project_name}
          scrumMasterName={room.scrum_master_name}
          deckName={deck?.name ?? room.deck_type}
          deckType={room.deck_type}
          ticketCode={round.ticket_code}
          ticketUrl={round.ticket_url}
          initialRound={{
            id: round.id,
            status: round.status,
            votes: initialVotes,
            stats: initialStats,
          }}
        />
      </div>
    </div>
  );
}
