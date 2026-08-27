import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSellerReport, sellerReportExportUrl } from "../api";
import type {
  MarketplaceSellerTotals,
  MonthlySellerTotals,
  SellerReport,
  SellerTotals,
} from "../types/card";

const currentYear = new Date().getFullYear();

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function monthOptions(year: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    return {
      value: month,
      label: new Date(`${month}-01T00:00:00`).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  });
}

function reportRows(totals: SellerTotals) {
  return [
    ["Revenue", totals.revenueCents],
    ["Refunds and returns", -totals.refundCents],
    ["Adjustments", totals.adjustmentCents],
    ["Cost of goods sold", -totals.realizedCostBasisCents],
    ["Marketplace fees", -totals.marketplaceFeesCents],
    ["Shipping", -totals.shippingCostCents],
    ["Supplies", -totals.suppliesCostCents],
    ["Grading", -totals.gradingCostCents],
    ["Net profit", totals.netProfitCents],
  ] as const;
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive" | "negative";
}) {
  return (
    <div className={`reportMetric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}

type BreakdownProps =
  | {
      rows: MonthlySellerTotals[];
      labelKey: "month";
    }
  | {
      rows: MarketplaceSellerTotals[];
      labelKey: "marketplace";
    };

function BreakdownTable({ rows, labelKey }: BreakdownProps) {
  if (rows.length === 0) {
    return <p className="sellerMuted">No report data for this period.</p>;
  }

  const tableRows =
    labelKey === "month"
      ? rows.map((row) => ({ label: row.month, totals: row }))
      : rows.map((row) => ({ label: row.marketplace, totals: row }));

  return (
    <div className="transactionsTableWrap">
      <table className="transactionsTable reportTable">
        <thead>
          <tr>
            <th>{labelKey === "month" ? "Month" : "Marketplace"}</th>
            <th>Revenue</th>
            <th>COGS</th>
            <th>Fees</th>
            <th>Shipping</th>
            <th>Supplies</th>
            <th>Grading</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map(({ label, totals }) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{formatCurrency(totals.revenueCents)}</td>
              <td>{formatCurrency(totals.realizedCostBasisCents)}</td>
              <td>{formatCurrency(totals.marketplaceFeesCents)}</td>
              <td>{formatCurrency(totals.shippingCostCents)}</td>
              <td>{formatCurrency(totals.suppliesCostCents)}</td>
              <td>{formatCurrency(totals.gradingCostCents)}</td>
              <td>{formatCurrency(totals.netProfitCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Reports() {
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState("");
  const [report, setReport] = useState<SellerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("year", year);
    if (month) params.set("month", month);
    return `?${params.toString()}`;
  }, [year, month]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setReport(await fetchSellerReport(queryString));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load seller report",
      );
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <main className="container operationsPage">
      <div className="pageHeader">
        <div>
          <p className="sellerEyebrow">Seller Workflow</p>
          <h1>Reports</h1>
        </div>
      </div>

      <section className="operationsPanel">
        <div className="sectionHeader transactionFilters">
          <h2>Reporting Period</h2>
          <div>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setMonth("");
              }}
            />
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            >
              <option value="">Year to date</option>
              {monthOptions(Number(year) || currentYear).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <a
              className="primaryButton exportButton"
              href={sellerReportExportUrl(queryString)}
            >
              Export CSV
            </a>
          </div>
        </div>

        {loading && <p className="sellerMuted">Loading report...</p>}
        {error && (
          <div className="inlineAlert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadReport}>
              Retry
            </button>
          </div>
        )}

        {report && !loading && !error && (
          <>
            <div className="reportMetricGrid">
              <MetricCard label="Revenue" value={report.totals.revenueCents} />
              <MetricCard
                label="COGS"
                value={report.totals.realizedCostBasisCents}
              />
              <MetricCard
                label="Fees"
                value={report.totals.marketplaceFeesCents}
              />
              <MetricCard
                label="Net"
                value={report.totals.netProfitCents}
                tone={report.totals.netProfitCents >= 0 ? "positive" : "negative"}
              />
            </div>

            <div className="reportSummary">
              <div>
                <h3>{report.month ? "Monthly Profit Report" : "Year-to-Date Seller Report"}</h3>
                <p>
                  {report.label} includes {report.transactionCount} seller
                  transactions.
                </p>
              </div>
              <dl>
                {reportRows(report.totals).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{formatCurrency(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
      </section>

      {report && !loading && !error && (
        <>
          <section className="operationsPanel">
            <div className="sectionHeader">
              <h2>Marketplace Breakdown</h2>
            </div>
            <BreakdownTable rows={report.byMarketplace} labelKey="marketplace" />
          </section>

          <section className="operationsPanel">
            <div className="sectionHeader">
              <h2>Monthly Profit</h2>
            </div>
            <BreakdownTable rows={report.monthly} labelKey="month" />
          </section>
        </>
      )}
    </main>
  );
}

export default Reports;
