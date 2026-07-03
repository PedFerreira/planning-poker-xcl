import { supabaseClient } from "@/lib/supabase/client";

export function getRoomChannel(roomId: string, participantId: string) {
  return supabaseClient.channel(`room:${roomId}`, {
    config: { presence: { key: participantId } },
  });
}
