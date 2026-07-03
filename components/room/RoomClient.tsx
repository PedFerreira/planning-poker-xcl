"use client";

import { useEffect } from "react";
import { getStoredIdentity, storeIdentity } from "@/lib/identity";
import { getSmToken } from "@/lib/sm-token";
import { generateParticipantId } from "@/lib/ids";
import { useIdentityStore } from "@/store/useIdentityStore";
import { useRoomPresence } from "@/lib/realtime/use-room-presence";
import { JoinForm } from "@/components/room/JoinForm";
import { RoomHeader } from "@/components/room/RoomHeader";
import { VotingTable } from "@/components/room/VotingTable";

export function RoomClient({
  roomId,
  projectName,
  scrumMasterName,
  deckName,
  ticketCode,
  ticketUrl,
}: {
  roomId: string;
  projectName: string;
  scrumMasterName: string;
  deckName: string;
  ticketCode?: string;
  ticketUrl?: string | null;
}) {
  const identity = useIdentityStore((state) => state.identity);
  const hydrated = useIdentityStore((state) => state.hydrated);
  const hydrate = useIdentityStore((state) => state.hydrate);

  useEffect(() => {
    const stored = getStoredIdentity(roomId);
    if (stored) {
      hydrate(stored);
      return;
    }

    // Quem criou a sala já tem nome capturado e o token de SM salvo no
    // localStorage (ScrumMasterTokenCapture) — entra direto na mesa.
    if (getSmToken(roomId)) {
      const smIdentity = {
        participantId: generateParticipantId(),
        name: scrumMasterName,
        role: "Outro" as const,
        roleOther: "Scrum Master",
      };
      storeIdentity(roomId, smIdentity);
      hydrate(smIdentity);
      return;
    }

    hydrate(null);
  }, [roomId, hydrate, scrumMasterName]);

  const participants = useRoomPresence(roomId, identity);

  if (!hydrated) {
    return null;
  }

  if (!identity) {
    return <JoinForm roomId={roomId} />;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <RoomHeader
        projectName={projectName}
        scrumMasterName={scrumMasterName}
        deckName={deckName}
        ticketCode={ticketCode}
        ticketUrl={ticketUrl}
      />
      <VotingTable participants={participants} selfId={identity.participantId} />
    </div>
  );
}
