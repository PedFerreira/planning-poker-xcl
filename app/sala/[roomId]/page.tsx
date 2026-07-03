import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getDeck } from "@/config/decks";
import { getCurrentRoundState } from "@/lib/room-state";
import { ScrumMasterTokenCapture } from "@/components/room/ScrumMasterTokenCapture";
import { RoomClient } from "@/components/room/RoomClient";
import { Header } from "@/components/layout/Header";

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

  const round = await getCurrentRoundState(roomId, room.deck_type);

  if (!round) {
    notFound();
  }

  const deck = getDeck(room.deck_type);

  return (
    <div className="bg-casino flex min-h-screen flex-1 flex-col">
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
          ticketCode={round.ticketCode}
          ticketUrl={round.ticketUrl}
          initialRound={{
            id: round.id,
            status: round.status,
            votes: round.votes,
            stats: round.stats,
          }}
        />
      </div>
    </div>
  );
}
