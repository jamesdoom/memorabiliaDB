import { useEffect, useState } from "react";
import { fetchSummary } from "../api";
import type { Summary } from "../types/card";

export function useCollectionSummary() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchSummary());
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
    loadSummary();
  }, []);

  return { data, loading, error, refetch: loadSummary };
}
