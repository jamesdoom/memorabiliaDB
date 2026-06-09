// memorabilia-client\src\components\CollectionValueCard.tsx

type Props = {
  good: number;
  perfect: number;
};

export default function CollectionValueCard({ good, perfect }: Props) {
  const low = Math.min(good, perfect);
  const high = Math.max(good, perfect);
  const upside = high - low;

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
    </div>
  );
}
