import { NextResponse } from "next/server";
import { getRoomById } from "@/lib/rooms";
import { verifySmToken } from "@/lib/sm-auth";
import { closeRoom } from "@/lib/purge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const room = await getRoomById(roomId);
  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  return NextResponse.json(room);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const authorized = await verifySmToken(roomId, request.headers.get("x-sm-token"));
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  await closeRoom(roomId, "manual");
  return NextResponse.json({ ok: true });
}
