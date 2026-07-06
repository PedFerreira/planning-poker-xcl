import { z } from "zod";
import { PARTICIPANT_ROLES } from "./domain";

export const ParticipantRoleSchema = z.enum(PARTICIPANT_ROLES);

export const PresencePayloadSchema = z.object({
  participantId: z.string().min(1),
  name: z.string().min(1).max(60),
  role: ParticipantRoleSchema,
  roleOther: z.string().max(60).optional(),
  hasVoted: z.boolean(),
  joinedAt: z.string().datetime(),
});
export type PresencePayload = z.infer<typeof PresencePayloadSchema>;

export const RoundPublicSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string(),
  roundNumber: z.number().int().positive(),
  ticketCode: z.string(),
  status: z.enum(["voting", "revealed"]),
  createdAt: z.string().datetime(),
  revealedAt: z.string().datetime().nullable(),
});
export type RoundPublic = z.infer<typeof RoundPublicSchema>;

export const RevealedVoteSchema = z.object({
  participantId: z.string(),
  participantName: z.string(),
  participantRole: ParticipantRoleSchema,
  cardValue: z.string(),
});

export const VoteStatsSchema = z.object({
  distribution: z.array(
    z.object({ value: z.string(), count: z.number().int().nonnegative() })
  ),
  numeric: z
    .object({
      average: z.number(),
      median: z.number(),
      min: z.number(),
      max: z.number(),
    })
    .nullable(),
  consensus: z.boolean(),
  excludedCount: z.number().int().nonnegative(),
});

export const VoteCastEventSchema = z.object({
  type: z.literal("vote_cast"),
  roundId: z.string().uuid(),
  participantId: z.string(),
});

export const VoteRetractedEventSchema = z.object({
  type: z.literal("vote_retracted"),
  roundId: z.string().uuid(),
  participantId: z.string(),
});

export const RoundStartedEventSchema = z.object({
  type: z.literal("round_started"),
  round: RoundPublicSchema,
});

export const CardsRevealedEventSchema = z.object({
  type: z.literal("cards_revealed"),
  roundId: z.string().uuid(),
  revealedAt: z.string().datetime(),
  votes: z.array(RevealedVoteSchema),
  stats: VoteStatsSchema,
});

export const RealtimeEventSchema = z.discriminatedUnion("type", [
  VoteCastEventSchema,
  VoteRetractedEventSchema,
  RoundStartedEventSchema,
  CardsRevealedEventSchema,
]);
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

export const BROADCAST_EVENT_NAME = "room_event";
