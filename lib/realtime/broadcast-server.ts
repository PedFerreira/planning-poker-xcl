import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { BROADCAST_EVENT_NAME, type RealtimeEvent } from "@/types/realtime";

export async function broadcastRoomEvent(roomId: string, event: RealtimeEvent) {
  const channel = supabaseServer.channel(`room:${roomId}`);
  try {
    await channel.httpSend(BROADCAST_EVENT_NAME, event);
  } finally {
    await supabaseServer.removeChannel(channel);
  }
}
