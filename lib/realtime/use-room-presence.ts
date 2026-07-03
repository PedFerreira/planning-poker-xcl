"use client";

import { useEffect, useState } from "react";
import { getRoomChannel } from "@/lib/realtime/channel";
import { supabaseClient } from "@/lib/supabase/client";
import type { PresencePayload } from "@/types/realtime";
import type { StoredIdentity } from "@/lib/identity";

export function useRoomPresence(roomId: string, identity: StoredIdentity | null) {
  const [participants, setParticipants] = useState<PresencePayload[]>([]);

  useEffect(() => {
    if (!identity) {
      return;
    }

    const channel = getRoomChannel(roomId, identity.participantId);

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresencePayload>();
      const list = Object.values(state)
        .map((entries) => entries[0])
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
      setParticipants(list);
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
        await channel.track(payload);
      }
    });

    return () => {
      channel.unsubscribe();
      supabaseClient.removeChannel(channel);
    };
  }, [roomId, identity]);

  return participants;
}
