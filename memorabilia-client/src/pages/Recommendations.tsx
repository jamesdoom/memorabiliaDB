// memorabilia-client\src\pages\Recommendations.tsx

import { useEffect, useState } from "react";
import { fetchRecommendations, updateCardStatus } from "../api";
import type { CardStatus, RecommendationCard } from "../types/card";
import "./Recommendations.css";

export default function Recommendations() {
  const [grade, setGrade] = useState<RecommendationCard[]>([]);
  const [sellRaw, setSellRaw] = useState<RecommendationCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations()
      .then((data) => {
        setGrade(data.grade || []);
        setSellRaw(data.sellRaw || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  const updateStatus = async (
    id: string,
    status: Extract<CardStatus, "LISTED" | "GRADED">,
  ) => {
    try {
      await updateCardStatus(id, status);

      setGrade((prev) => prev.filter((card) => card.id !== id));
      setSellRaw((prev) => prev.filter((card) => card.id !== id));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="container">
      <h1>Recommendations</h1>

      {/* Grade Section */}
      <h2>ðŸ”¥ Grade These</h2>
      {grade.length === 0 ? (
        <p>No strong grading candidates.</p>
      ) : (
        <ul>
          {grade.map((card) => (
            <li key={card.id}>
              {card.playerName} ({card.year}) â€“ {card.title} | Profit: $
              {card.gradingProfitPotential ?? 0}
              <button onClick={() => updateStatus(card.id, "GRADED")}>
                Mark Graded
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Sell Raw Section */}
      <h2>ðŸ’° Sell Raw</h2>
      {sellRaw.length === 0 ? (
        <p>No sell candidates.</p>
      ) : (
        <ul>
          {sellRaw.map((card) => (
            <li key={card.id}>
              {card.playerName} ({card.year}) â€“ {card.title} | Value: $
              {card.goodConditionValue ?? 0}
              <button onClick={() => updateStatus(card.id, "LISTED")}>
                Mark Listed
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
