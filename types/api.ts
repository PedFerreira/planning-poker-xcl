import { z } from "zod";
import { DECK_LIST } from "@/config/decks";

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
