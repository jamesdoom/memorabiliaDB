import { useCallback, useEffect, useState } from "react";
import { fetchRecommendations, updateCardStatus } from "../api";
import type { CardStatus, RecommendationCard } from "../types/card";
import "./Recommendations.css";

export default function Recommendations() {
  const [grade, setGrade] = useState<RecommendationCard[]>([]);
  const [sellRaw, setSellRaw] = useState<RecommendationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRecommendations();
      setGrade(data.grade || []);
      setSellRaw(data.sellRaw || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load recommendations",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const updateStatus = async (
    id: string,
    status: Extract<CardStatus, "LISTED" | "GRADED">,
  ) => {
    setUpdatingId(id);
    setError(null);

    try {
      await updateCardStatus(id, status);
      setGrade((prev) => prev.filter((card) => card.id !== id));
      setSellRaw((prev) => prev.filter((card) => card.id !== id));
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p className="recommendationsState">Loading...</p>;

  return (
    <div className="container">
      <h1>Recommendations</h1>

      {error && (
        <div className="inlineAlert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadRecommendations}>
            Retry
          </button>
        </div>
      )}

      <section className="recommendationSection">
        <h2>Grade These</h2>
        {grade.length === 0 ? (
          <p>No strong grading candidates.</p>
        ) : (
          <ul className="recommendationList">
            {grade.map((card) => (
              <li className="recommendationItem" key={card.id}>
                <div>
                  <strong>{card.playerName}</strong> ({card.year}) -{" "}
                  {card.title}
                  <span>Profit: ${card.gradingProfitPotential ?? 0}</span>
                </div>
                <button
                  disabled={updatingId === card.id}
                  onClick={() => updateStatus(card.id, "GRADED")}
                >
                  {updatingId === card.id ? "Saving..." : "Mark Graded"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="recommendationSection">
        <h2>Sell Raw</h2>
        {sellRaw.length === 0 ? (
          <p>No sell candidates.</p>
        ) : (
          <ul className="recommendationList">
            {sellRaw.map((card) => (
              <li className="recommendationItem" key={card.id}>
                <div>
                  <strong>{card.playerName}</strong> ({card.year}) -{" "}
                  {card.title}
                  <span>Value: ${card.goodConditionValue ?? 0}</span>
                </div>
                <button
                  disabled={updatingId === card.id}
                  onClick={() => updateStatus(card.id, "LISTED")}
                >
                  {updatingId === card.id ? "Saving..." : "Mark Listed"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
