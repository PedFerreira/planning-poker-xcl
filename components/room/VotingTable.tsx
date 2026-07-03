import { ParticipantSeat } from "@/components/room/ParticipantSeat";
import { getDeck } from "@/config/decks";
import type { PresencePayload } from "@/types/realtime";
import type { RevealedVote } from "@/types/domain";

export function VotingTable({
  participants,
  selfId,
  deckType,
  revealed,
  revealedVotes,
}: {
  participants: PresencePayload[];
  selfId: string;
  deckType: string;
  revealed: boolean;
  revealedVotes: RevealedVote[] | null;
}) {
  const deck = getDeck(deckType);
  const labelByParticipant = new Map(
    (revealedVotes ?? []).map((vote) => [
      vote.participantId,
      deck?.cards.find((card) => card.value === vote.cardValue)?.label ?? vote.cardValue,
    ])
  );

  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-3xl border bg-card p-8 shadow-sm">
      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Entrando na mesa…</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-6">
          {participants.map((participant) => (
            <ParticipantSeat
              key={participant.participantId}
              participant={participant}
              isSelf={participant.participantId === selfId}
              revealed={revealed}
              revealedLabel={labelByParticipant.get(participant.participantId)}
            />
          ))}
        </div>
      )}
      {participants.length === 1 && (
        <p className="text-center text-xs text-muted-foreground">
          Compartilhe o link da sala para o time entrar.
        </p>
      )}
    </div>
  );
}
