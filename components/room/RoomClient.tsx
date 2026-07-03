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
import { RoundHistory } from "@/components/room/RoundHistory";
import { NextTicketForm } from "@/components/room/NextTicketForm";
import { Button } from "@/components/ui/button";
import type { RoundStatus, RevealedVote, VoteStats } from "@/types/domain";
import type { RealtimeEvent, RoundPublic } from "@/types/realtime";
import type { RevealResponse, CreateRoundResponse, RoundHistoryEntry } from "@/types/api";

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
  ticketCode: string;
  ticketUrl: string | null;
  initialRound: RoundState;
}) {
  const identity = useIdentityStore((state) => state.identity);
  const hydrated = useIdentityStore((state) => state.hydrated);
  const hydrate = useIdentityStore((state) => state.hydrate);

  const [round, setRound] = useState<RoundState>(initialRound);
  const [ticket, setTicket] = useState({ code: ticketCode, url: ticketUrl });
  const [history, setHistory] = useState<RoundHistoryEntry[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(() => {
    if (typeof window === "undefined" || initialRound.status !== "voting") return null;
    const stored = getOwnVote(roomId);
    return stored && stored.roundId === initialRound.id ? stored.cardValue : null;
  });
  const [revealing, setRevealing] = useState(false);
  const [startingRound, setStartingRound] = useState(false);
  const [showNextTicketForm, setShowNextTicketForm] = useState(false);
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

  const { participants, setHasVoted } = useRoomChannel(roomId, identity, handleRealtimeEvent);

  function applyNewRound(newRound: RoundPublic) {
    setRound({ id: newRound.id, status: newRound.status, votes: null, stats: null });
    setTicket({ code: newRound.ticketCode, url: newRound.ticketUrl });
    setSelectedCard(null);
    clearOwnVote(roomId);
    void setHasVoted(false);
  }

  function handleRealtimeEvent(event: RealtimeEvent) {
    if (event.type === "cards_revealed" && event.roundId === round.id) {
      setRound((prev) => ({ ...prev, status: "revealed", votes: event.votes, stats: event.stats }));
    }
    if (event.type === "round_started") {
      applyNewRound(event.round);
    }
  }

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

  // Histórico inclui a rodada assim que ela é revelada e sempre que uma nova
  // rodada começa (a anterior passa a fazer parte do histórico).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rooms/${roomId}/history`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rounds: RoundHistoryEntry[] } | null) => {
        if (!cancelled && data) {
          setHistory(data.rounds);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [roomId, round.id, round.status]);

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

  async function handleRevote() {
    await startRound({ mode: "revote" });
  }

  async function handleNextTicket(fields: {
    ticketCode: string;
    ticketUrl: string;
    ticketDescription: string;
  }) {
    await startRound({ mode: "next", ...fields });
  }

  async function startRound(
    body: { mode: "revote" } | { mode: "next"; ticketCode: string; ticketUrl: string; ticketDescription: string }
  ) {
    const smToken = getSmToken(roomId);
    if (!smToken || startingRound) return;
    setStartingRound(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sm-token": smToken },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = (await res.json()) as CreateRoundResponse;
        applyNewRound(data.round);
        setShowNextTicketForm(false);
      }
    } finally {
      setStartingRound(false);
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
        ticketCode={ticket.code}
        ticketUrl={ticket.url}
      />

      {isScrumMaster && !revealed && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleReveal} disabled={revealing}>
            {revealing ? "Revelando…" : "Revelar cartas"}
          </Button>
        </div>
      )}

      {isScrumMaster && revealed && !showNextTicketForm && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleRevote} disabled={startingRound}>
            {startingRound ? "Criando…" : "Nova rodada"}
          </Button>
          <Button type="button" onClick={() => setShowNextTicketForm(true)} disabled={startingRound}>
            Próximo ticket
          </Button>
        </div>
      )}

      {isScrumMaster && showNextTicketForm && (
        <NextTicketForm
          submitting={startingRound}
          onSubmit={handleNextTicket}
          onCancel={() => setShowNextTicketForm(false)}
        />
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

      <RoundHistory deckType={deckType} rounds={history} />
    </div>
  );
}
