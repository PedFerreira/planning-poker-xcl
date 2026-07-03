import { getDeck } from "@/config/decks";
import type { RoundHistoryEntry } from "@/types/api";

export function RoundHistory({
  deckType,
  rounds,
}: {
  deckType: string;
  rounds: RoundHistoryEntry[];
}) {
  if (rounds.length === 0) return null;

  const deck = getDeck(deckType);

  function summaryFor(entry: RoundHistoryEntry) {
    if (entry.stats.consensus) return "Consenso 🎉";
    if (entry.stats.numeric) {
      return `Média ${entry.stats.numeric.average.toFixed(1)} · Mediana ${entry.stats.numeric.median}`;
    }
    return entry.stats.distribution
      .map((row) => `${deck?.cards.find((c) => c.value === row.value)?.label ?? row.value}×${row.count}`)
      .join(" · ");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Histórico de rodadas</h2>
      <ul className="flex flex-col divide-y">
        {rounds.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div>
              <p className="font-medium">
                {entry.ticketCode}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  · rodada {entry.roundNumber}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.revealedAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="text-right text-xs text-muted-foreground">{summaryFor(entry)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
