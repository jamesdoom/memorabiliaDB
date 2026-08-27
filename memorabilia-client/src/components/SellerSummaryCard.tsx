import type { SellerSummary } from "../types/card";

type SellerSummaryCardProps = {
  summary: SellerSummary | null;
  loading: boolean;
  error: string | null;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function SellerSummaryCard({ summary, loading, error }: SellerSummaryCardProps) {
  const latestMonth = summary?.monthly[0];

  return (
    <section className="sellerSummary" aria-labelledby="seller-summary-title">
      <div className="sellerSummaryHeader">
        <div>
          <p className="sellerEyebrow">Seller Dashboard</p>
          <h2 id="seller-summary-title">Profit Snapshot</h2>
        </div>
        <span className="sellerTransactionCount">
          {summary?.transactionCount ?? 0} ledger entries
        </span>
      </div>

      {loading && <p className="sellerMuted">Loading seller totals...</p>}
      {error && <p className="sellerError">{error}</p>}

      {!loading && !error && summary && (
        <>
          <div className="sellerMetricGrid">
            <div>
              <span>Revenue</span>
              <strong>{formatCurrency(summary.totals.revenueCents)}</strong>
            </div>
            <div>
              <span>All-in Costs</span>
              <strong>
                {formatCurrency(
                  summary.totals.purchaseCostCents +
                    summary.totals.marketplaceFeesCents +
                    summary.totals.shippingCostCents +
                    summary.totals.gradingCostCents +
                    summary.totals.suppliesCostCents,
                )}
              </strong>
            </div>
            <div>
              <span>Net Profit</span>
              <strong>{formatCurrency(summary.totals.netProfitCents)}</strong>
            </div>
            <div>
              <span>Latest Month</span>
              <strong>
                {latestMonth
                  ? formatCurrency(latestMonth.netProfitCents)
                  : formatCurrency(0)}
              </strong>
            </div>
          </div>

          <div className="sellerCostBreakdown">
            <span>Inventory {formatCurrency(summary.totals.purchaseCostCents)}</span>
            <span>Fees {formatCurrency(summary.totals.marketplaceFeesCents)}</span>
            <span>Shipping {formatCurrency(summary.totals.shippingCostCents)}</span>
            <span>Grading {formatCurrency(summary.totals.gradingCostCents)}</span>
            <span>Supplies {formatCurrency(summary.totals.suppliesCostCents)}</span>
          </div>
        </>
      )}
    </section>
  );
}

export default SellerSummaryCard;
