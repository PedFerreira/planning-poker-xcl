export const PARTICIPANT_ROLES = [
  "Desenvolvedor",
  "QA",
  "PO",
  "Tech Lead",
  "Observador",
  "Outro",
] as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export type RoundStatus = "voting" | "revealed";

export type Room = {
  id: string;
  projectName: string;
  scrumMasterName: string;
  deckType: string;
  createdAt: string;
};

export type Round = {
  id: string;
  roomId: string;
  roundNumber: number;
  ticketCode: string;
  ticketUrl: string | null;
  ticketTitle: string;
  ticketDescription: string | null;
  status: RoundStatus;
  createdAt: string;
  revealedAt: string | null;
};

export type RevealedVote = {
  participantId: string;
  participantName: string;
  participantRole: ParticipantRole;
  cardValue: string;
};

export type VoteStats = {
  distribution: { value: string; count: number }[];
  numeric: { average: number; median: number; min: number; max: number } | null;
  consensus: boolean;
  excludedCount: number;
};
