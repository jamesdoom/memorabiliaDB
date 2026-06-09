export type ValuationProvider = "manual";

export type ValuationInput = {
  provider?: string;
  goodConditionValue?: number | null;
  perfectConditionValue?: number | null;
  valueSource?: string | null;
  valueSourceUrl?: string | null;
  valueConfidence?: number | null;
  valueNotes?: string | null;
};

export type ValuationUpdate = {
  goodConditionValue?: number | null;
  perfectConditionValue?: number | null;
  valueSource: string | null;
  valueSourceUrl?: string | null;
  valueConfidence?: number | null;
  valueNotes?: string | null;
  lastValuedAt: Date;
};

const providerLabels: Record<ValuationProvider, string> = {
  manual: "Manual estimate",
};

function normalizeProvider(provider?: string): ValuationProvider {
  if (!provider || provider.toLowerCase() === "manual") return "manual";
  throw new Error(`Unsupported valuation provider: ${provider}`);
}

export function buildValuationUpdate(
  input: ValuationInput,
): ValuationUpdate {
  const provider = normalizeProvider(input.provider);
  const update: ValuationUpdate = {
    lastValuedAt: new Date(),
    valueSource: input.valueSource ?? providerLabels[provider],
  };

  if (input.goodConditionValue !== undefined) {
    update.goodConditionValue = input.goodConditionValue;
  }

  if (input.perfectConditionValue !== undefined) {
    update.perfectConditionValue = input.perfectConditionValue;
  }

  if (input.valueSourceUrl !== undefined) {
    update.valueSourceUrl = input.valueSourceUrl;
  }

  if (input.valueConfidence !== undefined) {
    update.valueConfidence = input.valueConfidence;
  }

  if (input.valueNotes !== undefined) {
    update.valueNotes = input.valueNotes;
  }

  return update;
}
