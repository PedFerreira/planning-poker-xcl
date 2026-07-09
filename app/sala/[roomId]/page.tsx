import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getRoomById } from "@/lib/rooms";
import { getDeck } from "@/config/decks";
import { ScrumMasterTokenCapture } from "@/components/room/ScrumMasterTokenCapture";
import { RoomClient } from "@/components/room/RoomClient";
import { Header } from "@/components/layout/Header";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const room = await getRoomById(roomId);
  if (!room) {
    notFound();
  }

  // Sem tabela de rounds, o estado da rodada não vem mais do SSR — nasce do
  // cache local (rodada 1 recém-criada, ou último round conhecido desta
  // aba) e/ou da presence de quem já está conectado (ver
  // lib/round-gossip.ts). RoomClient mostra "sincronizando…" até resolver.
  const deck = getDeck(room.deckType);

  return (
    <div className="bg-casino flex min-h-screen flex-1 flex-col">
      <Suspense fallback={null}>
        <ScrumMasterTokenCapture roomId={roomId} />
      </Suspense>
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <RoomClient
          roomId={roomId}
          projectName={room.projectName}
          scrumMasterName={room.scrumMasterName}
          deckName={deck?.name ?? room.deckType}
          deckType={room.deckType}
        />
      </div>
    </div>
  );
}
