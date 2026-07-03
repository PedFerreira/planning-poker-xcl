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
    <div className="sticky bottom-0 flex justify-center border-t bg-background/95 px-4 py-4 backdrop-blur">
      <div className="flex max-w-full flex-wrap justify-center gap-2">
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
