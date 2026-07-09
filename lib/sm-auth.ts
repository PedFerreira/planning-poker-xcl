import "server-only";
import { timingSafeEqual } from "node:crypto";
import { getScrumMasterToken } from "@/lib/rooms";

export async function verifySmToken(
  roomId: string,
  headerToken: string | null
): Promise<boolean> {
  if (!headerToken) return false;

  const token = await getScrumMasterToken(roomId);
  if (!token) return false;

  const a = Buffer.from(headerToken);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
