import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { computeVoteStats } from "@/lib/stats";
import type { RevealedVote, RoundStatus, VoteStats } from "@/types/domain";

export type CurrentRoundState = {
  id: string;
  roundNumber: number;
  status: RoundStatus;
  ticketCode: string;
  votes: RevealedVote[] | null;
  stats: VoteStats | null;
};

/**
 * Estado atual (última rodada) direto do Postgres — usado tanto na leitura
 * inicial (SSR) quanto no resync do client ao reconectar o canal Realtime,
 * para o caso de um broadcast ter sido perdido enquanto offline.
 */
export async function getCurrentRoundState(
  roomId: string,
  deckType: string
): Promise<CurrentRoundState | null> {
  const { data: round } = await supabaseServer
    .from("rounds")
    .select("id, round_number, status, ticket_code")
    .eq("room_id", roomId)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!round) return null;

  let votes: RevealedVote[] | null = null;
  let stats: VoteStats | null = null;

  if (round.status === "revealed") {
    const { data: voteRows } = await supabaseServer
      .from("votes")
      .select("participant_id, participant_name, participant_role, card_value")
      .eq("round_id", round.id);

    votes = (voteRows ?? []).map((row) => ({
      participantId: row.participant_id,
      participantName: row.participant_name,
      participantRole: row.participant_role,
      cardValue: row.card_value,
    }));
    stats = computeVoteStats(
      deckType,
      votes.map((v) => ({ cardValue: v.cardValue }))
    );
  }

  return {
    id: round.id,
    roundNumber: round.round_number,
    status: round.status,
    ticketCode: round.ticket_code,
    votes,
    stats,
  };
}
