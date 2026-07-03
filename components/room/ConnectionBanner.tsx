import type { ConnectionStatus } from "@/lib/realtime/use-room-channel";

export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  if (status === "connected") return null;

  return (
    <div
      role="status"
      className={
        "rounded-lg px-4 py-2 text-center text-sm " +
        (status === "disconnected"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground")
      }
    >
      {status === "disconnected"
        ? "Conexão perdida — tentando reconectar…"
        : "Conectando à sala…"}
    </div>
  );
}
