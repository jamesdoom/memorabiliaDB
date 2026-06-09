// memorabilia-client\src\pages\Recommendations.tsx

import { useEffect, useState } from "react";
import "./Recommendations.css";

type Card = {
  id: string;
  playerName: string;
  year: number;
  title: string;
  gradingProfitPotential: number | null;
  goodConditionValue: number | null;
};

export default function Recommendations() {
  const [grade, setGrade] = useState<Card[]>([]);
  const [sellRaw, setSellRaw] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/cards/recommendations")
      .then((res) => res.json())
      .then((data) => {
        setGrade(data.grade || []);
        setSellRaw(data.sellRaw || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  const updateStatus = async (id: string, status: "LISTED" | "GRADED") => {
    try {
      await fetch(`http://localhost:5000/cards/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      // 🔥 Remove card from UI instantly
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
      <h2>🔥 Grade These</h2>
      {grade.length === 0 ? (
        <p>No strong grading candidates.</p>
      ) : (
        <ul>
          {grade.map((card) => (
            <li key={card.id}>
              {card.playerName} ({card.year}) – {card.title} | Profit: $
              {card.gradingProfitPotential ?? 0}
              <button onClick={() => updateStatus(card.id, "GRADED")}>
                Mark Graded
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Sell Raw Section */}
      <h2>💰 Sell Raw</h2>
      {sellRaw.length === 0 ? (
        <p>No sell candidates.</p>
      ) : (
        <ul>
          {sellRaw.map((card) => (
            <li key={card.id}>
              {card.playerName} ({card.year}) – {card.title} | Value: $
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
