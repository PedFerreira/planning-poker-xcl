"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRoomChannel } from "@/lib/realtime/channel";
import { supabaseClient } from "@/lib/supabase/client";
import { pickCurrentRound } from "@/lib/round-gossip";
import { storeLastKnownRound } from "@/lib/round-cache";
import {
  BROADCAST_EVENT_NAME,
  RealtimeEventSchema,
  type PresencePayload,
  type RealtimeEvent,
  type RoundMirror,
} from "@/types/realtime";
import type { StoredIdentity } from "@/lib/identity";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useRoomChannel(
  roomId: string,
  identity: StoredIdentity | null,
  initialRound: RoundMirror | null,
  onRoomClosed?: (reason: "inactivity" | "manual") => void
) {
  const [participants, setParticipants] = useState<PresencePayload[]>([]);
  const [round, setRound] = useState<RoundMirror | null>(initialRound);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const trackedPayloadRef = useRef<PresencePayload | null>(null);
  const roundRef = useRef<RoundMirror | null>(initialRound);
  const onRoomClosedRef = useRef(onRoomClosed);
  useEffect(() => {
    onRoomClosedRef.current = onRoomClosed;
  });

  useEffect(() => {
    if (!identity) {
      return;
    }

    const channel = getRoomChannel(roomId, identity.participantId);
    channelRef.current = channel;

    // roundRef precisa refletir o round assim que decidimos trocá-lo (não só
    // depois do próximo commit) — trackCurrent() e o handler de reveal leem
    // roundRef.current de forma síncrona, antes de qualquer re-render.
    function updateRound(next: RoundMirror | null) {
      roundRef.current = next;
      setRound(next);
      if (next) storeLastKnownRound(roomId, next);
    }

    async function trackCurrent() {
      const current = roundRef.current;
      if (!current) return;
      const payload: PresencePayload = trackedPayloadRef.current
        ? { ...trackedPayloadRef.current, round: current }
        : {
            participantId: identity!.participantId,
            name: identity!.name,
            role: identity!.role,
            roleOther: identity!.roleOther,
            hasVoted: false,
            joinedAt: new Date().toISOString(),
            round: current,
          };
      trackedPayloadRef.current = payload;
      await channel.track(payload);
    }

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresencePayload>();
      // Em StrictMode (dev) o efeito roda 2x e pode deixar, por um instante,
      // duas entradas de presence para a mesma key — a última é a atual.
      const list = Object.values(state)
        .map((entries) => entries[entries.length - 1])
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
      setParticipants(list);

      const gossiped = pickCurrentRound(list);
      if (gossiped && (!roundRef.current || gossiped.createdAt > roundRef.current.createdAt)) {
        updateRound(gossiped);
      }

      // Um participante recém-chegado não tem round nenhum na própria
      // presence (campo obrigatório em PresencePayload) até saber, via
      // gossip de quem já está na sala, qual é a rodada atual — sem isso
      // trackCurrent() nunca roda e ele fica invisível pra todo mundo.
      if (!trackedPayloadRef.current && roundRef.current) {
        void trackCurrent();
      }
    });

    channel.on("broadcast", { event: BROADCAST_EVENT_NAME }, ({ payload }) => {
      const parsed = RealtimeEventSchema.safeParse(payload);
      if (!parsed.success) return;
      applyEvent(parsed.data);
    });

    function applyEvent(event: RealtimeEvent) {
      if (event.type === "round_started") {
        updateRound(event.round);
        trackedPayloadRef.current = null; // próximo trackCurrent() começa hasVoted:false
        void trackCurrent();
      }
      if (event.type === "reveal_requested" && roundRef.current?.id === event.roundId) {
        const next: RoundMirror = {
          ...roundRef.current,
          status: "revealed",
          revealedAt: event.revealedAt,
        };
        updateRound(next);
        const current = trackedPayloadRef.current;
        if (current) {
          trackedPayloadRef.current = { ...current, round: next };
          void channel.track(trackedPayloadRef.current);
        }
      }
      if (event.type === "room_closed") {
        onRoomClosedRef.current?.(event.reason);
      }
    }

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setConnectionStatus("connected");
        await trackCurrent();
      } else {
        setConnectionStatus("disconnected");
      }
    });

    return () => {
      channelRef.current = null;
      trackedPayloadRef.current = null;
      channel.unsubscribe();
      supabaseClient.removeChannel(channel);
    };
  }, [roomId, identity]);

  /** O valor da carta nunca vai pra presence aqui — só `hasVoted`. O valor
   * fica só no client (RoomClient guarda via lib/vote-storage.ts) até o
   * reveal, quando entra via `revealOwnVote`. */
  async function castVote() {
    const channel = channelRef.current;
    const current = trackedPayloadRef.current;
    if (!channel || !current) return;
    const next: PresencePayload = { ...current, hasVoted: true, cardValue: undefined };
    trackedPayloadRef.current = next;
    await channel.track(next);
  }

  async function retractVote() {
    const channel = channelRef.current;
    const current = trackedPayloadRef.current;
    if (!channel || !current) return;
    const next: PresencePayload = { ...current, hasVoted: false, cardValue: undefined };
    trackedPayloadRef.current = next;
    await channel.track(next);
  }

  /** Chamado depois que este client revela seu próprio valor (guardado só
   * localmente até então) em resposta a um `reveal_requested`. */
  async function revealOwnVote(cardValue: string) {
    const channel = channelRef.current;
    const current = trackedPayloadRef.current;
    if (!channel || !current) return;
    const next: PresencePayload = { ...current, cardValue };
    trackedPayloadRef.current = next;
    await channel.track(next);
  }

  return { participants, round, connectionStatus, castVote, retractVote, revealOwnVote };
}
