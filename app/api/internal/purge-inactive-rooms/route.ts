import { NextResponse } from "next/server";
import { listInactiveRoomIds } from "@/lib/rooms";
import { closeRoom } from "@/lib/purge";

const INACTIVITY_THRESHOLD_MS = 60 * 60 * 1000; // 1 hora

/**
 * Varredura de expurgo por inatividade. Protegida por secret compartilhado
 * em vez de sessão/IP pra funcionar igual em qualquer scheduler (Vercel
 * Cron, GitHub Actions, EventBridge Scheduler na futura migração pra AWS —
 * ver README, "Preparação para AWS").
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const threshold = new Date(Date.now() - INACTIVITY_THRESHOLD_MS).toISOString();
  const roomIds = await listInactiveRoomIds(threshold);

  await Promise.all(roomIds.map((id) => closeRoom(id, "inactivity")));

  return NextResponse.json({ purged: roomIds.length });
}
