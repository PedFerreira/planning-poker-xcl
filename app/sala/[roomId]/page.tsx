import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getDeck } from "@/config/decks";
import { ScrumMasterTokenCapture } from "@/components/room/ScrumMasterTokenCapture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const { data: room } = await supabaseServer
    .from("rooms")
    .select("id, project_name, scrum_master_name, deck_type")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    notFound();
  }

  const { data: round } = await supabaseServer
    .from("rounds")
    .select("ticket_code, ticket_url, ticket_title, ticket_description")
    .eq("room_id", roomId)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const deck = getDeck(room.deck_type);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <ScrumMasterTokenCapture roomId={roomId} />
      </Suspense>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{room.project_name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Facilitador: {room.scrum_master_name} · Baralho: {deck?.name ?? room.deck_type}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {round && (
            <p className="text-sm">
              Ticket atual: <span className="font-medium">{round.ticket_code}</span>
              {round.ticket_url && (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={round.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    abrir no Jira
                  </a>
                </>
              )}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Sala criada. Entrada de participantes e mesa de votação chegam nas
            próximas fases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
