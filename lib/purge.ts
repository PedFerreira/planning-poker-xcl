import "server-only";
import { deleteRoom } from "@/lib/rooms";
import { broadcastRoomEvent } from "@/lib/realtime/broadcast-server";

/**
 * Expurgo de uma sala: usado tanto pelo encerramento manual do Scrum Master
 * quanto pela varredura de inatividade (>1h). Como rounds/votes não existem
 * mais como tabelas, "todos os dados relacionados à sala" é só a própria
 * linha de `rooms`.
 */
export async function closeRoom(
  roomId: string,
  reason: "inactivity" | "manual"
): Promise<void> {
  await broadcastRoomEvent(roomId, { type: "room_closed", reason });
  await deleteRoom(roomId);
}
