import { z } from "zod";
import { DECK_LIST } from "@/config/decks";
import {
  ParticipantRoleSchema,
  RoundPublicSchema,
  VoteStatsSchema,
  RevealedVoteSchema,
} from "@/types/realtime";

const deckKeys = DECK_LIST.map((deck) => deck.key) as [string, ...string[]];

export const CreateRoomRequestSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  scrumMasterName: z.string().trim().min(1).max(60),
  deckType: z.enum(deckKeys),
  ticketCode: z.string().trim().min(1).max(60),
  ticketUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  ticketDescription: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

export const CreateRoomResponseSchema = z.object({
  roomId: z.string(),
  scrumMasterToken: z.string(),
});
export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;

export const CastVoteRequestSchema = z.object({
  participantId: z.string().min(1).max(32),
  participantName: z.string().trim().min(1).max(60),
  participantRole: ParticipantRoleSchema,
  cardValue: z.string().min(1).max(20),
});
export type CastVoteRequest = z.infer<typeof CastVoteRequestSchema>;

export const RetractVoteRequestSchema = z.object({
  participantId: z.string().min(1).max(32),
});
export type RetractVoteRequest = z.infer<typeof RetractVoteRequestSchema>;

export const VoteStatusResponseSchema = z.object({
  hasVoted: z.boolean(),
});
export type VoteStatusResponse = z.infer<typeof VoteStatusResponseSchema>;

export const RevealResponseSchema = z.object({
  revealedAt: z.string().datetime(),
  votes: z.array(RevealedVoteSchema),
  stats: VoteStatsSchema,
});
export type RevealResponse = z.infer<typeof RevealResponseSchema>;

export const CreateRoundRequestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("revote") }),
  z.object({
    mode: z.literal("next"),
    ticketCode: z.string().trim().min(1).max(60),
    ticketUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
    ticketDescription: z.string().trim().max(2000).optional().or(z.literal("")),
  }),
]);
export type CreateRoundRequest = z.infer<typeof CreateRoundRequestSchema>;

export const CreateRoundResponseSchema = z.object({
  round: RoundPublicSchema,
});
export type CreateRoundResponse = z.infer<typeof CreateRoundResponseSchema>;

export const RoundHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  roundNumber: z.number().int().positive(),
  ticketCode: z.string(),
  ticketUrl: z.string().url().nullable(),
  revealedAt: z.string().datetime(),
  stats: VoteStatsSchema,
});
export type RoundHistoryEntry = z.infer<typeof RoundHistoryEntrySchema>;

export const RoomHistoryResponseSchema = z.object({
  rounds: z.array(RoundHistoryEntrySchema),
});
export type RoomHistoryResponse = z.infer<typeof RoomHistoryResponseSchema>;
