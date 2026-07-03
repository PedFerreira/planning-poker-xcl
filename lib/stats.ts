import { getDeck, isExcludedFromNumericStats } from "@/config/decks";
import type { VoteStats } from "@/types/domain";

export function computeVoteStats(
  deckType: string,
  votes: { cardValue: string }[]
): VoteStats {
  const deck = getDeck(deckType);

  const distributionMap = new Map<string, number>();
  for (const vote of votes) {
    distributionMap.set(vote.cardValue, (distributionMap.get(vote.cardValue) ?? 0) + 1);
  }
  const distribution = Array.from(distributionMap, ([value, count]) => ({ value, count }));

  const validValues = votes.map((v) => v.cardValue).filter((v) => !isExcludedFromNumericStats(v));
  const excludedCount = votes.length - validValues.length;

  let numeric: VoteStats["numeric"] = null;
  if (deck?.supportsNumericStats) {
    const numbers = validValues
      .map((value) => deck.cards.find((card) => card.value === value)?.numericValue)
      .filter((value): value is number => typeof value === "number");

    if (numbers.length > 0) {
      const sorted = [...numbers].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

      numeric = {
        average: sorted.reduce((sum, n) => sum + n, 0) / sorted.length,
        median,
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    }
  }

  const consensus = validValues.length > 0 && validValues.every((v) => v === validValues[0]);

  return { distribution, numeric, consensus, excludedCount };
}
