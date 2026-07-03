"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRoomChannel } from "@/lib/realtime/channel";
import { supabaseClient } from "@/lib/supabase/client";
import {
  BROADCAST_EVENT_NAME,
  RealtimeEventSchema,
  type PresencePayload,
  type RealtimeEvent,
} from "@/types/realtime";
import type { StoredIdentity } from "@/lib/identity";

export function useRoomChannel(
  roomId: string,
  identity: StoredIdentity | null,
  onEvent?: (event: RealtimeEvent) => void
) {
  const [participants, setParticipants] = useState<PresencePayload[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const trackedPayloadRef = useRef<PresencePayload | null>(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!identity) {
      return;
    }

    const channel = getRoomChannel(roomId, identity.participantId);
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresencePayload>();
      // Em StrictMode (dev) o efeito roda 2x e pode deixar, por um instante,
      // duas entradas de presence para a mesma key — a última é a atual.
      const list = Object.values(state)
        .map((entries) => entries[entries.length - 1])
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
      setParticipants(list);
    });

    channel.on("broadcast", { event: BROADCAST_EVENT_NAME }, ({ payload }) => {
      const parsed = RealtimeEventSchema.safeParse(payload);
      if (parsed.success) {
        onEventRef.current?.(parsed.data);
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const payload: PresencePayload = {
          participantId: identity.participantId,
          name: identity.name,
          role: identity.role,
          roleOther: identity.roleOther,
          hasVoted: false,
          joinedAt: new Date().toISOString(),
        };
        trackedPayloadRef.current = payload;
        await channel.track(payload);
      }
    });

    return () => {
      channelRef.current = null;
      trackedPayloadRef.current = null;
      channel.unsubscribe();
      supabaseClient.removeChannel(channel);
    };
  }, [roomId, identity]);

  async function setHasVoted(hasVoted: boolean) {
    const channel = channelRef.current;
    const current = trackedPayloadRef.current;
    if (!channel || !current) return;

    const next: PresencePayload = { ...current, hasVoted };
    trackedPayloadRef.current = next;
    await channel.track(next);
  }

  return { participants, setHasVoted };
}
