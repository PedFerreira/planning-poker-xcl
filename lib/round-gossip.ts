import { computeVoteStats } from "@/lib/stats";
import type { PresencePayload, RoundMirror } from "@/types/realtime";
import type { RevealedVote, VoteStats } from "@/types/domain";

/**
 * Sem tabela de rounds, a rodada "atual" é a que a maioria da sala já
 * conhece — reconstruída a partir do que cada participante carrega na
 * própria presence (ver types/realtime.ts RoundMirror). Usado tanto no
 * bootstrap (mount/reconexão) quanto pra decidir se um evento recebido é
 * mais novo que o estado local.
 *
 * Critério: maior `createdAt` (ISO, ordena lexicograficamente); empate por
 * `id` (string compare, só pra todo mundo convergir na mesma escolha); para
 * o mesmo `id`, `revealed` sempre vence `voting` (transição monotônica).
 */
export function pickCurrentRound(participants: PresencePayload[]): RoundMirror | null {
  let best: RoundMirror | null = null;

  for (const participant of participants) {
    const candidate = participant.round;
    if (!candidate) continue;

    if (!best) {
      best = candidate;
      continue;
    }

    if (candidate.id === best.id) {
      if (candidate.status === "revealed" && best.status !== "revealed") {
        best = candidate;
      }
      continue;
    }

    if (
      candidate.createdAt > best.createdAt ||
      (candidate.createdAt === best.createdAt && candidate.id > best.id)
    ) {
      best = candidate;
    }
  }

  return best;
}

export function deriveRevealedVotes(
  participants: PresencePayload[],
  roundId: string
): RevealedVote[] {
  return participants
    .filter((p) => p.round?.id === roundId && p.cardValue !== undefined)
    .map((p) => ({
      participantId: p.participantId,
      participantName: p.name,
      participantRole: p.role,
      cardValue: p.cardValue as string,
    }));
}

export function deriveVoteStats(deckType: string, votes: RevealedVote[]): VoteStats {
  return computeVoteStats(
    deckType,
    votes.map((v) => ({ cardValue: v.cardValue }))
  );
}
