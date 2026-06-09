// src/api.ts
const API_BASE = "http://localhost:5000";

export async function fetchCards(queryString = "") {
  const response = await fetch(`http://localhost:5000/cards${queryString}`);

  if (!response.ok) {
    throw new Error("Failed to fetch cards");
  }

  return response.json();
}

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/cards/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}
