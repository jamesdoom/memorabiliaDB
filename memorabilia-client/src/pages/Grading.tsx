import { useCallback, useEffect, useState } from "react";
import {
  createGradingBatch,
  fetchGradingBatches,
  fetchGradingRecommendations,
  returnGradingBatch,
} from "../api";
import type {
  GradingCompany,
  GradingRecommendationResponse,
  GradingSubmissionBatch,
} from "../types/card";
import { portfolioReadOnlyMessage } from "../access";

const initialBatchForm = {
  name: "",
  company: "PSA" as GradingCompany,
  serviceLevel: "",
  submittedAt: "",
  notes: "",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString() : "Not set";
}

type GradingProps = {
  readOnly?: boolean;
};

function Grading({ readOnly = false }: GradingProps) {
  const [batches, setBatches] = useState<GradingSubmissionBatch[]>([]);
  const [recommendations, setRecommendations] = useState<
    GradingRecommendationResponse[]
  >([]);
  const [batchForm, setBatchForm] = useState(initialBatchForm);
  const [returnBatchId, setReturnBatchId] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [returnRows, setReturnRows] = useState<
    Record<string, { finalGrade: string; gradingCertNumber: string; value: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadGrading = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [batchData, recommendationData] = await Promise.all([
        fetchGradingBatches(),
        fetchGradingRecommendations(),
      ]);
      setBatches(batchData);
      setRecommendations(recommendationData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load grading workflow",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrading();
  }, [loadGrading]);

  async function handleCreateBatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError(null);

    try {
      await createGradingBatch({
        name: batchForm.name.trim(),
        company: batchForm.company,
        serviceLevel: batchForm.serviceLevel.trim() || null,
        submittedAt: batchForm.submittedAt || null,
        notes: batchForm.notes.trim() || null,
      });
      setBatchForm(initialBatchForm);
      setNotice("Grading batch created.");
      await loadGrading();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to create grading batch",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReturnBatch(batch: GradingSubmissionBatch) {
    if (readOnly) return;
    setSaving(true);
    setError(null);

    try {
      await returnGradingBatch(batch.id, {
        returnedAt: returnDate,
        cards: batch.cards.map((card) => {
          const row = returnRows[card.id] ?? {
            finalGrade: "",
            gradingCertNumber: "",
            value: "",
          };

          return {
            id: card.id,
            finalGrade: row.finalGrade.trim() || null,
            gradingCertNumber: row.gradingCertNumber.trim() || null,
            expectedGradedValueCents: row.value
              ? Math.round(Number(row.value) * 100)
              : null,
          };
        }),
      });
      setReturnBatchId(null);
      setReturnRows({});
      setNotice("Batch returned and cards converted to graded inventory.");
      await loadGrading();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to return grading batch",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container operationsPage">
      <div className="pageHeader">
        <div>
          <p className="sellerEyebrow">Seller Workflow</p>
          <h1>Grading</h1>
        </div>
      </div>

      {readOnly && (
        <div className="portfolioReadOnlyBanner" role="note">
          <strong>Portfolio demo</strong>
          <span>{portfolioReadOnlyMessage}</span>
        </div>
      )}

      {notice && (
        <div className="successAlert" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="inlineAlert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadGrading}>
            Retry
          </button>
        </div>
      )}

      {!readOnly && (
        <section className="operationsPanel">
        <div className="sectionHeader">
          <h2>Create Submission Batch</h2>
        </div>
        <form className="transactionForm" onSubmit={handleCreateBatch}>
          <div className="detailsGrid">
            <label>
              Batch name
              <input
                type="text"
                required
                value={batchForm.name}
                onChange={(event) =>
                  setBatchForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Company
              <select
                value={batchForm.company}
                onChange={(event) =>
                  setBatchForm((current) => ({
                    ...current,
                    company: event.target.value as GradingCompany,
                  }))
                }
              >
                <option value="PSA">PSA</option>
                <option value="SGC">SGC</option>
                <option value="BECKETT">Beckett</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              Service level
              <input
                type="text"
                value={batchForm.serviceLevel}
                onChange={(event) =>
                  setBatchForm((current) => ({
                    ...current,
                    serviceLevel: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Submitted date
              <input
                type="date"
                value={batchForm.submittedAt}
                onChange={(event) =>
                  setBatchForm((current) => ({
                    ...current,
                    submittedAt: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label>
            Notes
            <textarea
              rows={3}
              value={batchForm.notes}
              onChange={(event) =>
                setBatchForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </label>
          <div className="detailsActions">
            <button type="submit" className="primaryButton" disabled={saving}>
              {saving ? "Saving..." : "Create batch"}
            </button>
          </div>
        </form>
        </section>
      )}

      <section className="operationsPanel">
        <div className="sectionHeader">
          <h2>ROI Candidates</h2>
        </div>
        {loading ? (
          <p className="sellerMuted">Loading grading candidates...</p>
        ) : (
          <div className="gradingGrid">
            {recommendations.slice(0, 8).map(({ card, roi }) => (
              <article className="gradingCandidate" key={card.id}>
                <span className={`gradingRecommendation ${roi.recommendation.toLowerCase()}`}>
                  {roi.recommendation}
                </span>
                <h3>{card.playerName}</h3>
                <p>
                  {card.year} {card.title}
                </p>
                <dl>
                  <div>
                    <dt>Raw</dt>
                    <dd>{formatCurrency(roi.rawValueCents)}</dd>
                  </div>
                  <div>
                    <dt>Expected</dt>
                    <dd>{formatCurrency(roi.expectedGradedValueCents)}</dd>
                  </div>
                  <div>
                    <dt>Fees</dt>
                    <dd>{formatCurrency(roi.gradingFeeCents)}</dd>
                  </div>
                  <div>
                    <dt>ROI</dt>
                    <dd>{formatCurrency(roi.estimatedProfitCents)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="operationsPanel">
        <div className="sectionHeader">
          <h2>Submission Batches</h2>
        </div>
        {loading ? (
          <p className="sellerMuted">Loading batches...</p>
        ) : (
          <div className="batchList">
            {batches.length === 0 && (
              <p className="sellerMuted">No grading batches yet.</p>
            )}
            {batches.map((batch) => (
              <article className="batchItem" key={batch.id}>
                <div className="batchHeader">
                  <div>
                    <h3>{batch.name}</h3>
                    <p>
                      {batch.company}
                      {batch.serviceLevel ? ` - ${batch.serviceLevel}` : ""}
                    </p>
                  </div>
                  <span>{batch.cards.length} cards</span>
                </div>
                <div className="sellerCostBreakdown">
                  <span>Submitted {formatDate(batch.submittedAt)}</span>
                  <span>Returned {formatDate(batch.returnedAt)}</span>
                </div>
                {batch.cards.length > 0 && (
                  <ul className="batchCardList">
                    {batch.cards.map((card) => (
                      <li key={card.id}>
                        <span>
                          {card.playerName} {card.year}
                        </span>
                        <small>
                          {card.finalGrade
                            ? `Grade ${card.finalGrade}`
                            : card.status.replaceAll("_", " ")}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
                {batch.cards.length > 0 && !batch.returnedAt && (
                  <>
                    <button
                      type="button"
                      className="secondaryButton"
                      disabled={readOnly}
                      title={
                        readOnly ? portfolioReadOnlyMessage : undefined
                      }
                      onClick={() =>
                        setReturnBatchId((current) =>
                          current === batch.id ? null : batch.id,
                        )
                      }
                    >
                      {returnBatchId === batch.id ? "Close return" : "Return batch"}
                    </button>
                    {returnBatchId === batch.id && (
                      <div className="inlineTransactionEditor">
                        <label>
                          Return date
                          <input
                            type="date"
                            value={returnDate}
                            onChange={(event) => setReturnDate(event.target.value)}
                          />
                        </label>
                        <div className="returnRows">
                          {batch.cards.map((card) => {
                            const row = returnRows[card.id] ?? {
                              finalGrade: "",
                              gradingCertNumber: "",
                              value: "",
                            };

                            return (
                              <div key={card.id}>
                                <strong>
                                  {card.playerName} {card.year}
                                </strong>
                                <input
                                  type="text"
                                  placeholder="Final grade"
                                  value={row.finalGrade}
                                  onChange={(event) =>
                                    setReturnRows((current) => ({
                                      ...current,
                                      [card.id]: {
                                        ...row,
                                        finalGrade: event.target.value,
                                      },
                                    }))
                                  }
                                />
                                <input
                                  type="text"
                                  placeholder="Cert number"
                                  value={row.gradingCertNumber}
                                  onChange={(event) =>
                                    setReturnRows((current) => ({
                                      ...current,
                                      [card.id]: {
                                        ...row,
                                        gradingCertNumber: event.target.value,
                                      },
                                    }))
                                  }
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Graded value"
                                  value={row.value}
                                  onChange={(event) =>
                                    setReturnRows((current) => ({
                                      ...current,
                                      [card.id]: {
                                        ...row,
                                        value: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          className="primaryButton"
                          disabled={readOnly || saving}
                          onClick={() => handleReturnBatch(batch)}
                        >
                          {saving ? "Saving..." : "Save returned cards"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Grading;
