import type {
  Card,
  CardStatus,
  CardsResponse,
  RecommendationsResponse,
  Summary,
} from "./types/card";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { error?: string };
      if (errorBody.error) message = errorBody.error;
    } catch {
      // Keep the status-based message if the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchCards(queryString = ""): Promise<CardsResponse> {
  return requestJson<CardsResponse>(`/cards${queryString}`);
}

export async function fetchSummary(): Promise<Summary> {
  return requestJson<Summary>("/cards/summary");
}

export async function fetchRecommendations(): Promise<RecommendationsResponse> {
  return requestJson<RecommendationsResponse>("/cards/recommendations");
}

export async function updateCard(
  id: string,
  updates: Partial<Pick<Card, "imageFrontUrl" | "imageBackUrl">>,
): Promise<Card> {
  return requestJson<Card>(`/cards/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
}

export async function updateCardStatus(
  id: string,
  status: CardStatus,
): Promise<Card> {
  return requestJson<Card>(`/cards/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await requestJson<{ url: string }>("/upload", {
    method: "POST",
    body: formData,
  });

  return response.url;
}
