"use client";

import { useEffect, useState } from "react";
import { getStoredIdentity, storeIdentity } from "@/lib/identity";
import { getSmToken } from "@/lib/sm-token";
import { generateParticipantId } from "@/lib/ids";
import { getOwnVote, storeOwnVote, clearOwnVote } from "@/lib/vote-storage";
import { useIdentityStore } from "@/store/useIdentityStore";
import { useRoomChannel } from "@/lib/realtime/use-room-channel";
import { JoinForm } from "@/components/room/JoinForm";
import { RoomHeader } from "@/components/room/RoomHeader";
import { VotingTable } from "@/components/room/VotingTable";
import { DeckFooter } from "@/components/room/DeckFooter";
import { ResultsPanel } from "@/components/room/ResultsPanel";
import { Button } from "@/components/ui/button";
import type { RoundStatus, RevealedVote, VoteStats } from "@/types/domain";
import type { RealtimeEvent } from "@/types/realtime";
import type { RevealResponse } from "@/types/api";

type RoundState = {
  id: string;
  status: RoundStatus;
  votes: RevealedVote[] | null;
  stats: VoteStats | null;
};

export function RoomClient({
  roomId,
  projectName,
  scrumMasterName,
  deckName,
  deckType,
  ticketCode,
  ticketUrl,
  initialRound,
}: {
  roomId: string;
  projectName: string;
  scrumMasterName: string;
  deckName: string;
  deckType: string;
  ticketCode?: string;
  ticketUrl?: string | null;
  initialRound: RoundState;
}) {
  const identity = useIdentityStore((state) => state.identity);
  const hydrated = useIdentityStore((state) => state.hydrated);
  const hydrate = useIdentityStore((state) => state.hydrate);

  const [round, setRound] = useState<RoundState>(initialRound);
  const [selectedCard, setSelectedCard] = useState<string | null>(() => {
    if (typeof window === "undefined" || initialRound.status !== "voting") return null;
    const stored = getOwnVote(roomId);
    return stored && stored.roundId === initialRound.id ? stored.cardValue : null;
  });
  const [revealing, setRevealing] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

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

  function handleRealtimeEvent(event: RealtimeEvent) {
    if (event.type === "cards_revealed" && event.roundId === round.id) {
      setRound((prev) => ({ ...prev, status: "revealed", votes: event.votes, stats: event.stats }));
    }
  }

  const { participants, setHasVoted } = useRoomChannel(roomId, identity, handleRealtimeEvent);

  // hasVoted é autoritativo só via GET /vote-status; reconcilia a presence
  // ao entrar (cobre o caso de sessionStorage limpo em outro dispositivo).
  useEffect(() => {
    if (!identity || round.status !== "voting") return;
    let cancelled = false;

    fetch(`/api/rounds/${round.id}/vote-status?participantId=${identity.participantId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { hasVoted: boolean } | null) => {
        if (!cancelled && data) {
          setHasVoted(data.hasVoted);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, identity?.participantId, round.id, round.status]);

  async function handleSelectCard(cardValue: string) {
    if (!identity || round.status !== "voting") return;
    setVoteError(null);

    const isRetracting = selectedCard === cardValue;

    try {
      if (isRetracting) {
        const res = await fetch(`/api/rounds/${round.id}/votes`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: identity.participantId }),
        });
        if (!res.ok) throw new Error();
        clearOwnVote(roomId);
        setSelectedCard(null);
        await setHasVoted(false);
      } else {
        const res = await fetch(`/api/rounds/${round.id}/votes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: identity.participantId,
            participantName: identity.name,
            participantRole: identity.role,
            cardValue,
          }),
        });
        if (!res.ok) throw new Error();
        storeOwnVote(roomId, { roundId: round.id, cardValue });
        setSelectedCard(cardValue);
        await setHasVoted(true);
      }
    } catch {
      setVoteError("Não foi possível registrar seu voto. Tente novamente.");
    }
  }

  async function handleReveal() {
    const smToken = getSmToken(roomId);
    if (!smToken || revealing) return;
    setRevealing(true);
    try {
      const res = await fetch(`/api/rounds/${round.id}/reveal`, {
        method: "POST",
        headers: { "x-sm-token": smToken },
      });
      if (res.ok) {
        const data = (await res.json()) as RevealResponse;
        setRound((prev) => ({ ...prev, status: "revealed", votes: data.votes, stats: data.stats }));
      }
    } finally {
      setRevealing(false);
    }
  }

  if (!hydrated) {
    return null;
  }

  if (!identity) {
    return <JoinForm roomId={roomId} />;
  }

  const revealed = round.status === "revealed";
  const canVote = identity.role !== "Observador";
  const isScrumMaster = Boolean(getSmToken(roomId));

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 pb-28">
      <RoomHeader
        projectName={projectName}
        scrumMasterName={scrumMasterName}
        deckName={deckName}
        ticketCode={ticketCode}
        ticketUrl={ticketUrl}
      />

      {isScrumMaster && !revealed && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleReveal} disabled={revealing}>
            {revealing ? "Revelando…" : "Revelar cartas"}
          </Button>
        </div>
      )}

      {voteError && <p className="text-sm text-destructive">{voteError}</p>}

      <VotingTable
        participants={participants}
        selfId={identity.participantId}
        deckType={deckType}
        revealed={revealed}
        revealedVotes={round.votes}
      />

      {revealed && round.stats && <ResultsPanel deckType={deckType} stats={round.stats} />}

      {!revealed && canVote && (
        <DeckFooter
          deckType={deckType}
          selectedValue={selectedCard}
          disabled={round.status !== "voting"}
          onSelect={handleSelectCard}
        />
      )}

      {!revealed && !canVote && (
        <p className="text-center text-sm text-muted-foreground">
          Observadores acompanham a rodada sem votar.
        </p>
      )}
    </div>
  );
}
