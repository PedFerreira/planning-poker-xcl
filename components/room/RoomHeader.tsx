import { ShareLink } from "@/components/room/ShareLink";

export function RoomHeader({
  projectName,
  scrumMasterName,
  deckName,
  ticketCode,
  ticketUrl,
}: {
  projectName: string;
  scrumMasterName: string;
  deckName: string;
  ticketCode?: string;
  ticketUrl?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold">{projectName}</h1>
        <p className="text-sm text-muted-foreground">
          Facilitador: {scrumMasterName} · Baralho: {deckName}
        </p>
        {ticketCode && (
          <p className="mt-1 text-sm">
            Ticket atual: <span className="font-medium">{ticketCode}</span>
            {ticketUrl && (
              <>
                {" "}
                ·{" "}
                <a
                  href={ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  abrir no Jira
                </a>
              </>
            )}
          </p>
        )}
      </div>
      <ShareLink />
    </div>
  );
}
