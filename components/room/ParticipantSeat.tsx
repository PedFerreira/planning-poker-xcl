import { colorForParticipant, initials } from "@/lib/avatar";
import { Card } from "@/components/room/Card";
import type { PresencePayload } from "@/types/realtime";

export function ParticipantSeat({
  participant,
  isSelf,
  revealed,
  revealedLabel,
}: {
  participant: PresencePayload;
  isSelf: boolean;
  revealed: boolean;
  revealedLabel?: string;
}) {
  const roleLabel =
    participant.role === "Outro" && participant.roleOther
      ? participant.roleOther
      : participant.role;

  return (
    <div className="flex w-24 flex-col items-center gap-1.5 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-full text-base font-semibold text-white ring-offset-2"
        style={{
          backgroundColor: colorForParticipant(participant.participantId),
          boxShadow: isSelf ? "0 0 0 2px var(--ring)" : undefined,
        }}
      >
        {initials(participant.name)}
      </div>
      <p className="w-full truncate text-xs font-medium">
        {participant.name}
        {isSelf && " (você)"}
      </p>
      <p className="w-full truncate text-[0.65rem] text-muted-foreground">
        {roleLabel}
      </p>
      {revealed ? (
        revealedLabel ? (
          <Card label={revealedLabel} size="sm" animateReveal />
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            Não votou
          </span>
        )
      ) : (
        <span
          className={
            "rounded-full px-2 py-0.5 text-[0.65rem] font-medium " +
            (participant.hasVoted
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground")
          }
        >
          {participant.hasVoted ? "Votou" : "Aguardando"}
        </span>
      )}
    </div>
  );
}
