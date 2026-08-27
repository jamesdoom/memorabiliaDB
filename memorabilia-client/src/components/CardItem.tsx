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

        <p className="cardStatusBadge">{card.status.replaceAll("_", " ")}</p>

        {card.inventoryAgeDays !== null && (
          <p className="cardOperationalMeta">
            Inventory age: {card.inventoryAgeDays} days
          </p>
        )}

        {card.listingAgeDays !== null && (
          <p className="cardOperationalMeta">
            Listed: {card.listingAgeDays} days
          </p>
        )}

        {card.goodConditionValue !== null && (
          <p className="cardGoodValue">Raw: ${card.goodConditionValue}</p>
        )}

        {card.perfectConditionValue !== null && (
          <p className="cardPSAValue">PSA10: ${card.perfectConditionValue}</p>
        )}

        {card.priceReductionRecommendation && (
          <p className="priceReductionBadge">
            Reduce {card.priceReductionRecommendation.reductionPercent}% to $
            {(
              card.priceReductionRecommendation.recommendedPriceCents / 100
            ).toFixed(2)}
          </p>
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
