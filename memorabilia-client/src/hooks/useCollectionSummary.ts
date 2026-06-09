// memorabilia-client\src\hooks\useCollectionSummary.ts

import { useEffect, useState } from "react";

type StatusCount = {
  status: "NEW" | "LISTED" | "GRADED";
  _count: {
    status: number;
  };
};

type Summary = {
  totalCards: number;
  totalGoodConditionValue: number;
  totalPerfectConditionValue: number;
  averageGoodConditionValue: number;
  averagePerfectConditionValue: number;
  statusCounts: StatusCount[];
};

export function useCollectionSummary() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔥 EXTRACTED so we can reuse it
  const fetchSummary = async () => {
    try {
      const res = await fetch("http://localhost:5000/cards/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");

      const json = await res.json();
      setData(json as Summary);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // 🔥 RETURN refetch
  return { data, loading, error, refetch: fetchSummary };
}
