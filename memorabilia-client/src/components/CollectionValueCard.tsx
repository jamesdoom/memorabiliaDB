// memorabilia-client\src\components\CollectionValueCard.tsx

type Props = {
  good: number;
  perfect: number;
  valuedCards: number;
  missingValuations: number;
  averageValueConfidence: number;
  latestValuedAt: string | null;
};

export default function CollectionValueCard({
  good,
  perfect,
  valuedCards,
  missingValuations,
  averageValueConfidence,
  latestValuedAt,
}: Props) {
  const low = Math.min(good, perfect);
  const high = Math.max(good, perfect);
  const upside = high - low;
  const latestValuation = latestValuedAt
    ? new Date(latestValuedAt).toLocaleDateString()
    : "None";

  return (
    <div className="valueCard">
      <h2 className="valueTitle">Estimated Collection Value</h2>

      <div className="valueGrid">
        <div className="valueItem">
          <span className="valueLabel">Good</span>
          <p className="valueAmount">${good.toLocaleString()}</p>
        </div>

        <div className="valueItem">
          <span className="valueLabel">Perfect</span>
          <p className="valueAmount">${perfect.toLocaleString()}</p>
        </div>
      </div>

      <div className="valueDivider" />

      <div className="valueUpside">
        Potential upside <span>${upside.toLocaleString()}</span>
      </div>

      <div className="valuationStats">
        <div>
          <span className="valueLabel">Valued</span>
          <strong>{valuedCards.toLocaleString()}</strong>
        </div>
        <div>
          <span className="valueLabel">Needs valuation</span>
          <strong>{missingValuations.toLocaleString()}</strong>
        </div>
        <div>
          <span className="valueLabel">Avg confidence</span>
          <strong>{Math.round(averageValueConfidence)}%</strong>
        </div>
        <div>
          <span className="valueLabel">Latest update</span>
          <strong>{latestValuation}</strong>
        </div>
      </div>
    </div>
  );
}
