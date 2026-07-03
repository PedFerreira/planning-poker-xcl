import { getDeck } from "@/config/decks";
import { Card } from "@/components/room/Card";

export function DeckFooter({
  deckType,
  selectedValue,
  disabled,
  onSelect,
}: {
  deckType: string;
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (cardValue: string) => void;
}) {
  const deck = getDeck(deckType);
  if (!deck) return null;

  return (
    <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
      {/* Rola na horizontal em telas estreitas em vez de quebrar linha e
          cobrir a mesa — o baralho tem cartas demais para uma linha só no
          celular. */}
      <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-4">
        {deck.cards.map((card) => (
          <Card
            key={card.value}
            label={card.label}
            selected={selectedValue === card.value}
            disabled={disabled}
            onClick={() => onSelect(card.value)}
          />
        ))}
      </div>
    </div>
  );
}
