import { useCallback, useEffect, useState } from "react";
import {
  createSellerTransaction,
  deleteSellerTransaction,
  fetchSellerTransactions,
  updateSellerTransaction,
} from "../api";
import SellerTransactionForm from "../components/SellerTransactionForm";
import type {
  Pagination,
  SellerTransaction,
  SellerTransactionImportInput,
  SellerTransactionType,
} from "../types/card";

type TypeFilter = "" | SellerTransactionType;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function totalCosts(transaction: SellerTransaction) {
  return (
    transaction.costBasisCents +
    transaction.marketplaceFees +
    transaction.shippingCost +
    transaction.gradingCost +
    transaction.suppliesCost
  );
}

function netImpact(transaction: SellerTransaction) {
  if (transaction.type === "PURCHASE") return 0;
  if (transaction.type === "ADJUSTMENT") return transaction.amountCents;

  const sign = transaction.type === "SALE" ? 1 : -1;
  return sign * transaction.amountCents - totalCosts(transaction);
}

function Transactions() {
  const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [marketplace, setMarketplace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (typeFilter) params.append("type", typeFilter);
    if (marketplace.trim()) params.append("marketplace", marketplace.trim());
    return `?${params.toString()}`;
  }, [page, typeFilter, marketplace]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchSellerTransactions(buildQuery());
      setTransactions(response.data);
      setPagination(response.pagination);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load transactions",
      );
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, marketplace]);

  async function handleCreate(input: SellerTransactionImportInput) {
    await createSellerTransaction(input);
    setNotice("Transaction added.");
    await loadTransactions();
  }

  async function handleUpdate(
    id: string,
    input: SellerTransactionImportInput,
  ) {
    await updateSellerTransaction(id, input);
    setEditingId(null);
    setNotice("Transaction updated.");
    await loadTransactions();
  }

  async function handleDelete(transaction: SellerTransaction) {
    const confirmed = window.confirm(
      `Delete this ${transaction.type.toLowerCase()} transaction?`,
    );
    if (!confirmed) return;

    await deleteSellerTransaction(transaction.id);
    setNotice("Transaction deleted.");
    await loadTransactions();
  }

  return (
    <main className="container operationsPage">
      <div className="pageHeader">
        <div>
          <p className="sellerEyebrow">Seller Workflow</p>
          <h1>Transactions</h1>
        </div>
      </div>

      <section className="operationsPanel">
        <div className="sectionHeader">
          <h2>Manual Entry</h2>
        </div>
        <SellerTransactionForm onSubmit={handleCreate} />
      </section>

      <section className="operationsPanel">
        <div className="sectionHeader transactionFilters">
          <h2>Ledger</h2>
          <div>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as TypeFilter)
              }
            >
              <option value="">All types</option>
              <option value="SALE">Sales</option>
              <option value="PURCHASE">Purchases</option>
              <option value="REFUND">Refunds</option>
              <option value="RETURN">Returns</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
            <input
              type="text"
              placeholder="Marketplace"
              value={marketplace}
              onChange={(event) => setMarketplace(event.target.value)}
            />
          </div>
        </div>

        {notice && (
          <div className="successAlert" role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}

        {loading && <p className="sellerMuted">Loading transactions...</p>}
        {error && (
          <div className="inlineAlert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadTransactions}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <p className="sellerMuted">No transactions match these filters.</p>
        )}

        {transactions.length > 0 && (
          <div className="transactionsTableWrap">
            <table className="transactionsTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Card</th>
                  <th>Marketplace</th>
                  <th>Amount</th>
                  <th>Cost Basis</th>
                  <th>Costs</th>
                  <th>Net</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.occurredAt)}</td>
                    <td>
                      <span
                        className={`transactionType ${transaction.type.toLowerCase()}`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td>
                      {transaction.card ? (
                        <span>
                          {transaction.card.playerName}{" "}
                          <small>
                            {transaction.card.year} {transaction.card.title}
                          </small>
                        </span>
                      ) : (
                        <span className="sellerMuted">Unlinked</span>
                      )}
                    </td>
                    <td>{transaction.marketplace ?? "-"}</td>
                    <td>{formatCurrency(transaction.amountCents)}</td>
                    <td>{formatCurrency(transaction.costBasisCents)}</td>
                    <td>
                      {formatCurrency(totalCosts(transaction) - transaction.costBasisCents)}
                    </td>
                    <td>{formatCurrency(netImpact(transaction))}</td>
                    <td>
                      <div className="tableActions">
                        <button
                          type="button"
                          className="secondaryButton"
                          onClick={() =>
                            setEditingId((current) =>
                              current === transaction.id
                                ? null
                                : transaction.id,
                            )
                          }
                        >
                          {editingId === transaction.id ? "Close" : "Edit"}
                        </button>
                        <button
                          type="button"
                          className="dangerButton"
                          onClick={() => handleDelete(transaction)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.map(
              (transaction) =>
                editingId === transaction.id && (
                  <div className="inlineTransactionEditor" key={transaction.id}>
                    <SellerTransactionForm
                      initialTransaction={transaction}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(input) => handleUpdate(transaction.id, input)}
                    />
                  </div>
                ),
            )}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page === pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Transactions;
