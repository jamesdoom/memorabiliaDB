import type { Card } from "../types/card";
import CardItem from "./CardItem";

type Props = {
  cards: Card[];
  onSelect: (card: Card) => void;
};

export default function CardGrid({ cards, onSelect }: Props) {
  return (
    <div className="cardGrid">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} onSelect={onSelect} />
      ))}
    </div>
  );
}
