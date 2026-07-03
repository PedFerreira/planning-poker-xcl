import "server-only";
import { timingSafeEqual } from "crypto";
import { supabaseServer } from "@/lib/supabase/server";

export async function verifySmToken(
  roomId: string,
  headerToken: string | null
): Promise<boolean> {
  if (!headerToken) return false;

  const { data: room } = await supabaseServer
    .from("rooms")
    .select("scrum_master_token")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) return false;

  const a = Buffer.from(headerToken);
  const b = Buffer.from(room.scrum_master_token);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
