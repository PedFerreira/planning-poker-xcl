import { getDeck } from "@/config/decks";
import type { VoteStats } from "@/types/domain";

export function ResultsPanel({ deckType, stats }: { deckType: string; stats: VoteStats }) {
  const deck = getDeck(deckType);
  const order = deck?.cards.map((c) => c.value) ?? [];
  const rows = [...stats.distribution].sort(
    (a, b) => order.indexOf(a.value) - order.indexOf(b.value)
  );
  const maxCount = Math.max(1, ...rows.map((row) => row.count));

  function labelFor(value: string) {
    return deck?.cards.find((card) => card.value === value)?.label ?? value;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Resultado da rodada</h2>
        {stats.consensus && (
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
            Consenso 🎉
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.value} className="flex items-center gap-3">
            <span className="w-8 shrink-0 text-sm font-medium">{labelFor(row.value)}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-r-[4px] bg-muted">
              <div
                className="h-full rounded-r-[4px] bg-primary"
                style={{ width: `${(row.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
              {row.count} {row.count === 1 ? "voto" : "votos"}
            </span>
          </div>
        ))}
      </div>

      {stats.numeric && (
        <div className="grid grid-cols-4 gap-2 border-t pt-3 text-center text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Média</p>
            <p className="font-semibold">{stats.numeric.average.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mediana</p>
            <p className="font-semibold">{stats.numeric.median}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mín.</p>
            <p className="font-semibold">{stats.numeric.min}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Máx.</p>
            <p className="font-semibold">{stats.numeric.max}</p>
          </div>
        </div>
      )}

      {stats.excludedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {stats.excludedCount} voto(s) não contabilizado(s) nas estatísticas (❓/☕).
        </p>
      )}
    </div>
  );
}
