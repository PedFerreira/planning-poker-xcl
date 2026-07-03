import { ParticipantSeat } from "@/components/room/ParticipantSeat";
import type { PresencePayload } from "@/types/realtime";

export function VotingTable({
  participants,
  selfId,
}: {
  participants: PresencePayload[];
  selfId: string;
}) {
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
