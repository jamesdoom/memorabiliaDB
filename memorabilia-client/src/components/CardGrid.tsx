//memorabilia-client\src\components\CardGrid.tsx

import type { Card } from "../types/card";
import CardItem from "./CardItem";

type Props = {
  cards: Card[];
  onSelect: (card: Card) => void;
};

export default function CardGrid({ cards, onSelect }: Props) {
  const ids = cards.map((card) => card.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  console.log("Card IDs:", ids);
  console.log("Duplicate IDs:", duplicateIds);

  return (
    <div className="cardGrid">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} onSelect={onSelect} />
      ))}
    </div>
  );
}
