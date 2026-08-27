import type { MonthlySellerTotals, Summary } from "../types/card";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function MonthlyProfitChart({
  monthly,
}: {
  monthly: MonthlySellerTotals[];
}) {
  const rows = [...monthly].reverse().slice(-6);
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [
      Math.abs(row.revenueCents),
      Math.abs(row.netProfitCents),
    ]),
  );

  if (rows.length === 0) {
    return <p className="sellerMuted">No monthly sales yet.</p>;
  }

  return (
    <div className="chartPanel" aria-label="Monthly revenue and profit chart">
      <div className="chartLegend">
        <span>
          <i className="legendRevenue" /> Revenue
        </span>
        <span>
          <i className="legendProfit" /> Net profit
        </span>
      </div>
      <div className="barChart">
        {rows.map((row) => {
          const revenueHeight = Math.max(4, (row.revenueCents / maxValue) * 100);
          const profitHeight = Math.max(
            4,
            (Math.abs(row.netProfitCents) / maxValue) * 100,
          );

          return (
            <div className="barGroup" key={row.month}>
              <div className="barColumns">
                <span
                  className="bar revenue"
                  style={{ height: `${revenueHeight}%` }}
                  title={`Revenue ${formatCurrency(row.revenueCents)}`}
                />
                <span
                  className={`bar profit ${
                    row.netProfitCents < 0 ? "negative" : ""
                  }`}
                  style={{ height: `${profitHeight}%` }}
                  title={`Net profit ${formatCurrency(row.netProfitCents)}`}
                />
              </div>
              <small>{row.month.slice(5)}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InventoryValueChart({ summary }: { summary: Summary }) {
  const rawValueCents = summary.totalGoodConditionValue * 100;
  const gradedValueCents = summary.totalPerfectConditionValue * 100;
  const upsideCents = Math.max(gradedValueCents - rawValueCents, 0);
  const maxValue = Math.max(1, gradedValueCents, rawValueCents);

  return (
    <div className="chartPanel inventoryValueChart">
      <div>
        <span>Raw value</span>
        <strong>{formatCurrency(rawValueCents)}</strong>
        <div className="horizontalBarTrack">
          <span
            className="horizontalBar raw"
            style={{ width: `${(rawValueCents / maxValue) * 100}%` }}
          />
        </div>
      </div>
      <div>
        <span>Graded ceiling</span>
        <strong>{formatCurrency(gradedValueCents)}</strong>
        <div className="horizontalBarTrack">
          <span
            className="horizontalBar graded"
            style={{ width: `${(gradedValueCents / maxValue) * 100}%` }}
          />
        </div>
      </div>
      <div>
        <span>Potential upside</span>
        <strong>{formatCurrency(upsideCents)}</strong>
        <div className="horizontalBarTrack">
          <span
            className="horizontalBar upside"
            style={{ width: `${(upsideCents / maxValue) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
