import { z } from "zod";
import { PARTICIPANT_ROLES } from "./domain";

export const ParticipantRoleSchema = z.enum(PARTICIPANT_ROLES);

/**
 * Espelho da rodada atual, carregado por CADA participante na própria
 * presence — não existe mais em nenhuma tabela. Um client que entra ou
 * reconecta reconstrói o estado lendo isso de qualquer entrada de presence
 * já conectada (ver lib/round-gossip.ts), não consultando o servidor.
 */
export const RoundMirrorSchema = z.object({
  id: z.string().uuid(),
  ticketCode: z.string(),
  status: z.enum(["voting", "revealed"]),
  createdAt: z.string().datetime(),
  revealedAt: z.string().datetime().nullable(),
});
export type RoundMirror = z.infer<typeof RoundMirrorSchema>;

export const PresencePayloadSchema = z.object({
  participantId: z.string().min(1),
  name: z.string().min(1).max(60),
  role: ParticipantRoleSchema,
  roleOther: z.string().max(60).optional(),
  hasVoted: z.boolean(),
  /** Só aparece depois que este participante revela o próprio valor. */
  cardValue: z.string().max(20).optional(),
  joinedAt: z.string().datetime(),
  round: RoundMirrorSchema,
});
export type PresencePayload = z.infer<typeof PresencePayloadSchema>;

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

/** Disparado pelo servidor (SM-gated) ao criar a rodada 1 já é dispensado —
 * a rodada 1 nasce direto na resposta de POST /api/rooms, sem broadcast
 * (o SM ainda nem abriu o canal Realtime nesse momento). Este evento cobre
 * só revote/próximo ticket. */
export const RoundStartedEventSchema = z.object({
  type: z.literal("round_started"),
  round: RoundMirrorSchema,
});

/** Payload leve: o servidor nunca teve os votos (eles nunca saem do
 * client). Cada participante, ao receber isto, revela o próprio valor
 * (se tiver) na própria presence — stats são derivados no client. */
export const RevealRequestedEventSchema = z.object({
  type: z.literal("reveal_requested"),
  roundId: z.string().uuid(),
  revealedAt: z.string().datetime(),
});

export const RoomClosedEventSchema = z.object({
  type: z.literal("room_closed"),
  reason: z.enum(["inactivity", "manual"]),
});

export const RealtimeEventSchema = z.discriminatedUnion("type", [
  RoundStartedEventSchema,
  RevealRequestedEventSchema,
  RoomClosedEventSchema,
]);
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

export const BROADCAST_EVENT_NAME = "room_event";
