import type { Card } from "../types/card";

type Props = {
  card: Card;
  onSelect: (card: Card) => void;
};

export default function CardItem({ card, onSelect }: Props) {
  const valuedDate = card.lastValuedAt
    ? new Date(card.lastValuedAt).toLocaleDateString()
    : null;

  return (
    <div className="cardItem" onClick={() => onSelect(card)}>
      <div className="cardPreview">
        {card.imageFrontUrl ? (
          <img
            src={card.imageFrontUrl}
            alt={card.title}
            className="cardImage"
          />
        ) : (
          <div className="cardPlaceholder">No Image</div>
        )}
      </div>

      <div className="cardInfo">
        <h3 className="cardName">{card.playerName}</h3>

        <p className="cardMeta">
          {card.year} - {card.manufacturer}
        </p>

        {card.goodConditionValue !== null && (
          <p className="cardGoodValue">Raw: ${card.goodConditionValue}</p>
        )}

        {card.perfectConditionValue !== null && (
          <p className="cardPSAValue">PSA10: ${card.perfectConditionValue}</p>
        )}

        {card.valueSource && (
          <p className="cardValueSource">
            {card.valueSource}
            {card.valueConfidence !== null
              ? ` (${card.valueConfidence}% confidence)`
              : ""}
          </p>
        )}

        <p
          className={`valuationBadge ${
            card.lastValuedAt ? "valued" : "needsValuation"
          }`}
        >
          {card.lastValuedAt ? `Updated ${valuedDate}` : "Unvalued"}
        </p>
      </div>
    </div>
  );
}
