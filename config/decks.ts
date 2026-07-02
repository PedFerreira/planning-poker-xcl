export type CardKind = "numeric" | "special";

export type DeckCard = {
  /** Valor persistido/transmitido — estável, nunca traduzido na UI. */
  value: string;
  /** Rótulo exibido na carta. */
  label: string;
  kind: CardKind;
  /** Usado no cálculo de média/mediana quando kind === "numeric". */
  numericValue?: number;
};

export type Deck = {
  key: string;
  name: string;
  cards: DeckCard[];
  /** Só decks com supportsNumericStats mostram média/mediana no reveal. */
  supportsNumericStats: boolean;
};

export const DECKS: Record<string, Deck> = {
  fibonacci: {
    key: "fibonacci",
    name: "Fibonacci",
    supportsNumericStats: true,
    cards: [
      { value: "0", label: "0", kind: "numeric", numericValue: 0 },
      { value: "1", label: "1", kind: "numeric", numericValue: 1 },
      { value: "2", label: "2", kind: "numeric", numericValue: 2 },
      { value: "3", label: "3", kind: "numeric", numericValue: 3 },
      { value: "5", label: "5", kind: "numeric", numericValue: 5 },
      { value: "8", label: "8", kind: "numeric", numericValue: 8 },
      { value: "13", label: "13", kind: "numeric", numericValue: 13 },
      { value: "21", label: "21", kind: "numeric", numericValue: 21 },
      { value: "34", label: "34", kind: "numeric", numericValue: 34 },
      { value: "?", label: "?", kind: "special" },
      { value: "coffee", label: "☕", kind: "special" },
    ],
  },
  shirt_size: {
    key: "shirt_size",
    name: "Camisetas",
    supportsNumericStats: false,
    cards: [
      { value: "pp", label: "PP", kind: "numeric" },
      { value: "p", label: "P", kind: "numeric" },
      { value: "m", label: "M", kind: "numeric" },
      { value: "g", label: "G", kind: "numeric" },
      { value: "gg", label: "GG", kind: "numeric" },
      { value: "?", label: "?", kind: "special" },
      { value: "coffee", label: "☕", kind: "special" },
    ],
  },
  semaforo: {
    key: "semaforo",
    name: "Semáforo",
    supportsNumericStats: false,
    cards: [
      { value: "green", label: "🟢", kind: "numeric" },
      { value: "yellow", label: "🟡", kind: "numeric" },
      { value: "red", label: "🔴", kind: "numeric" },
    ],
  },
};

export const DECK_LIST = Object.values(DECKS);

export function getDeck(key: string): Deck | undefined {
  return DECKS[key];
}

export function isValidCardValue(deckKey: string, cardValue: string): boolean {
  const deck = getDeck(deckKey);
  if (!deck) return false;
  return deck.cards.some((card) => card.value === cardValue);
}

/** Valores excluídos do cálculo numérico (independentemente do kind marcado como "special"). */
export function isExcludedFromNumericStats(cardValue: string): boolean {
  return cardValue === "?" || cardValue === "coffee";
}
