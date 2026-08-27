import type {
  Card,
  CardStatus,
  CardsResponse,
  GradingRecommendationResponse,
  GradingSubmissionBatch,
  RecommendationsResponse,
  SellerSummary,
  SellerTransaction,
  SellerTransactionImportInput,
  SellerTransactionsResponse,
  SellerTransactionType,
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

export async function fetchGradingBatches(): Promise<GradingSubmissionBatch[]> {
  return requestJson<GradingSubmissionBatch[]>("/grading/batches");
}

export async function fetchGradingRecommendations(): Promise<
  GradingRecommendationResponse[]
> {
  return requestJson<GradingRecommendationResponse[]>("/grading/recommendations");
}

export type GradingBatchInput = Pick<
  GradingSubmissionBatch,
  "name" | "company"
> &
  Partial<
    Pick<
      GradingSubmissionBatch,
      "serviceLevel" | "submittedAt" | "returnedAt" | "notes"
    >
  >;

export async function createGradingBatch(
  input: GradingBatchInput,
): Promise<GradingSubmissionBatch> {
  return requestJson<GradingSubmissionBatch>("/grading/batches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function returnGradingBatch(
  id: string,
  input: {
    returnedAt: string;
    cards: Array<{
      id: string;
      finalGrade?: string | null;
      gradingCertNumber?: string | null;
      expectedGradedValueCents?: number | null;
    }>;
  },
): Promise<{ batch: GradingSubmissionBatch; cards: Card[] }> {
  return requestJson<{ batch: GradingSubmissionBatch; cards: Card[] }>(
    `/grading/batches/${id}/return`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
}

export async function fetchSellerSummary(): Promise<SellerSummary> {
  return requestJson<SellerSummary>("/seller/summary");
}

export async function fetchSellerTransactions(
  queryString = "",
): Promise<SellerTransactionsResponse> {
  return requestJson<SellerTransactionsResponse>(
    `/seller/transactions${queryString}`,
  );
}

export async function importSellerTransactions(
  transactions: SellerTransactionImportInput[],
): Promise<{ imported: number }> {
  return requestJson<{ imported: number }>("/seller/transactions/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactions }),
  });
}

export type SellerTransactionInput = SellerTransactionImportInput;

export async function createSellerTransaction(
  input: SellerTransactionInput,
): Promise<SellerTransaction> {
  return requestJson<SellerTransaction>("/seller/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export type SellerTransactionUpdate = Partial<
  Omit<SellerTransactionInput, "type"> & {
    type: SellerTransactionType;
  }
>;

export async function updateSellerTransaction(
  id: string,
  updates: SellerTransactionUpdate,
): Promise<SellerTransaction> {
  return requestJson<SellerTransaction>(`/seller/transactions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteSellerTransaction(id: string): Promise<void> {
  await requestJson<{ message: string }>(`/seller/transactions/${id}`, {
    method: "DELETE",
  });
}

export type CreateCardInput = Pick<
  Card,
  "playerName" | "sport" | "title" | "year" | "manufacturer" | "rookie"
> &
  Partial<
    Pick<
      Card,
      | "cardNumber"
      | "series"
      | "serialNumber"
      | "quantity"
      | "location"
      | "locationType"
      | "locationDetail"
      | "consignmentPartner"
      | "gradingSubmissionBatch"
      | "gradingSubmissionBatchId"
      | "gradingCompany"
      | "gradingServiceLevel"
      | "gradingSubmittedAt"
      | "gradingReturnedAt"
      | "gradingFeeCents"
      | "gradingCertNumber"
      | "finalGrade"
      | "expectedGradedValueCents"
      | "gradingConfidence"
      | "listingMarketplace"
      | "listingUrl"
      | "askingPriceCents"
      | "listedAt"
      | "soldAt"
      | "goodConditionValue"
      | "perfectConditionValue"
      | "valueSource"
      | "valueConfidence"
      | "lastValuedAt"
    >
  >;

export async function createCard(input: CreateCardInput): Promise<Card> {
  return requestJson<Card>("/cards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
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

export type CardDetailsUpdate = Partial<
  Pick<
    Card,
    | "playerName"
    | "sport"
    | "title"
    | "year"
    | "manufacturer"
    | "cardNumber"
    | "series"
    | "rookie"
    | "serialNumber"
    | "quantity"
    | "location"
    | "locationType"
    | "locationDetail"
    | "consignmentPartner"
    | "gradingSubmissionBatch"
    | "gradingSubmissionBatchId"
    | "gradingCompany"
    | "gradingServiceLevel"
    | "gradingSubmittedAt"
    | "gradingReturnedAt"
    | "gradingFeeCents"
    | "gradingCertNumber"
    | "finalGrade"
    | "expectedGradedValueCents"
    | "gradingConfidence"
    | "status"
    | "listingMarketplace"
    | "listingUrl"
    | "askingPriceCents"
    | "listedAt"
    | "soldAt"
  >
>;

export async function updateCardDetails(
  id: string,
  updates: CardDetailsUpdate,
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

export type ValuationUpdate = Partial<
  Pick<
    Card,
    | "goodConditionValue"
    | "perfectConditionValue"
    | "valueSource"
    | "valueSourceUrl"
    | "valueConfidence"
    | "valueNotes"
  >
> & {
  provider?: "manual";
};

export async function updateCardValuation(
  id: string,
  valuation: ValuationUpdate,
): Promise<Card> {
  return requestJson<Card>(`/cards/${id}/valuation`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(valuation),
  });
}

export async function deleteCard(id: string): Promise<void> {
  await requestJson<{ message: string }>(`/cards/${id}`, {
    method: "DELETE",
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
