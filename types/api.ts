import { z } from "zod";
import { DECK_LIST } from "@/config/decks";
import { RoundMirrorSchema } from "@/types/realtime";

const deckKeys = DECK_LIST.map((deck) => deck.key) as [string, ...string[]];

export const CreateRoomRequestSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  scrumMasterName: z.string().trim().min(1).max(60),
  deckType: z.enum(deckKeys),
  ticketCode: z.string().trim().min(1).max(15),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

export const CreateRoomResponseSchema = z.object({
  roomId: z.string(),
  scrumMasterToken: z.string(),
  round: RoundMirrorSchema,
});
export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;

export const CreateRoundRequestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("revote"), ticketCode: z.string().trim().min(1).max(15) }),
  z.object({
    mode: z.literal("next"),
    ticketCode: z.string().trim().min(1).max(15),
  }),
]);
export type CreateRoundRequest = z.infer<typeof CreateRoundRequestSchema>;

export const CreateRoundResponseSchema = z.object({
  round: RoundMirrorSchema,
});
export type CreateRoundResponse = z.infer<typeof CreateRoundResponseSchema>;

export const RevealRequestSchema = z.object({
  roundId: z.string().uuid(),
});
export type RevealRequest = z.infer<typeof RevealRequestSchema>;

export const RevealResponseSchema = z.object({
  revealedAt: z.string().datetime(),
});
export type RevealResponse = z.infer<typeof RevealResponseSchema>;
