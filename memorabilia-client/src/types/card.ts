// memorabilia-client\src\types\card.ts

export type Card = {
  id: string;
  slug: string;
  playerName: string;
  sport: string;
  title: string;
  year: number;
  manufacturer: string;
  cardNumber: string | null;
  series: string | null;
  rookie: boolean;
  goodConditionValue: number | null;
  perfectConditionValue: number | null;
  valueSource: string | null;
  valueSourceUrl: string | null;
  valueConfidence: number | null;
  valueNotes: string | null;
  lastValuedAt: string | null;
  serialNumber: string | null;
  quantity: number;
  status:
    | "NEW"
    | "READY_TO_LIST"
    | "LISTED"
    | "SOLD"
    | "SHIPPED"
    | "GRADED"
    | "ARCHIVED";
  imageFrontUrl: string | null;
  imageBackUrl: string | null;
  location: string | null;
  locationType:
    | "BOX"
    | "SHELF"
    | "BINDER"
    | "CONSIGNMENT"
    | "GRADING_SUBMISSION"
    | "OTHER"
    | null;
  locationDetail: string | null;
  consignmentPartner: string | null;
  gradingSubmissionBatch: string | null;
  gradingSubmissionBatchId: string | null;
  gradingCompany: "PSA" | "SGC" | "BECKETT" | "OTHER" | null;
  gradingServiceLevel: string | null;
  gradingSubmittedAt: string | null;
  gradingReturnedAt: string | null;
  gradingFeeCents: number | null;
  gradingCertNumber: string | null;
  finalGrade: string | null;
  expectedGradedValueCents: number | null;
  gradingConfidence: number | null;
  listingMarketplace: string | null;
  listingUrl: string | null;
  askingPriceCents: number | null;
  listedAt: string | null;
  soldAt: string | null;
  inventoryAgeDays: number | null;
  listingAgeDays: number | null;
  priceReductionRecommendation: {
    listingAgeDays: number;
    currentPriceCents: number;
    reductionPercent: number;
    recommendedPriceCents: number;
  } | null;
};

export type CardStatus = Card["status"];
export type InventoryLocationType = NonNullable<Card["locationType"]>;
export type GradingCompany = NonNullable<Card["gradingCompany"]>;

export type GradingSubmissionBatchCard = Pick<
  Card,
  | "id"
  | "playerName"
  | "title"
  | "year"
  | "status"
  | "finalGrade"
  | "gradingCertNumber"
>;

export type GradingSubmissionBatch = {
  id: string;
  name: string;
  company: GradingCompany;
  serviceLevel: string | null;
  submittedAt: string | null;
  returnedAt: string | null;
  notes: string | null;
  cards: GradingSubmissionBatchCard[];
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

export type StatusCount = {
  status: CardStatus;
  _count: {
    status: number;
  };
};

export type Summary = {
  totalCards: number;
  totalGoodConditionValue: number;
  totalPerfectConditionValue: number;
  averageGoodConditionValue: number;
  averagePerfectConditionValue: number;
  valuedCards: number;
  missingValuations: number;
  averageValueConfidence: number;
  latestValuedAt: string | null;
  staleListingCount: number;
  statusCounts: StatusCount[];
};

export type CardsResponse = {
  data: Card[];
  pagination: Pagination;
  summary: Summary;
};

export type RecommendationCard = Pick<
  Card,
  "id" | "playerName" | "year" | "title" | "goodConditionValue"
> & {
  gradingProfitPotential: number | null;
};

export type RecommendationsResponse = {
  grade: RecommendationCard[];
  sellRaw: RecommendationCard[];
};

export type GradingRoi = {
  rawValueCents: number;
  expectedGradedValueCents: number;
  gradingFeeCents: number;
  confidence: number;
  grossUpsideCents: number;
  estimatedProfitCents: number;
  recommendation: "STRONG" | "CONSIDER" | "SKIP";
};

export type GradingRecommendationResponse = {
  card: Card;
  roi: GradingRoi;
};

export type SellerTotals = {
  revenueCents: number;
  refundCents: number;
  adjustmentCents: number;
  purchaseSpendCents: number;
  realizedCostBasisCents: number;
  marketplaceFeesCents: number;
  shippingCostCents: number;
  gradingCostCents: number;
  suppliesCostCents: number;
  netProfitCents: number;
};

export type MonthlySellerTotals = SellerTotals & {
  month: string;
};

export type MarketplaceSellerTotals = SellerTotals & {
  marketplace: string;
};

export type CardSellerTotals = SellerTotals & {
  cardId: string;
  playerName: string;
  title: string;
  year: number;
  manufacturer: string;
};

export type SellerSummary = {
  transactionCount: number;
  totals: SellerTotals;
  monthly: MonthlySellerTotals[];
  byMarketplace: MarketplaceSellerTotals[];
  byCard: CardSellerTotals[];
};

export type SellerTransactionType =
  | "PURCHASE"
  | "SALE"
  | "REFUND"
  | "RETURN"
  | "ADJUSTMENT";

export type SellerTransactionImportInput = {
  cardId?: string | null;
  cardSlug?: string | null;
  type: SellerTransactionType;
  occurredAt: string;
  quantity: number;
  amountCents: number;
  costBasisCents: number;
  lotName?: string | null;
  lotCardCount?: number | null;
  marketplace?: string | null;
  orderId?: string | null;
  marketplaceFees: number;
  shippingCost: number;
  gradingCost: number;
  suppliesCost: number;
  notes?: string | null;
  sourceFile?: string | null;
};

export type SellerTransactionCard = Pick<
  Card,
  | "id"
  | "slug"
  | "playerName"
  | "title"
  | "year"
  | "manufacturer"
  | "cardNumber"
>;

export type SellerTransaction = Omit<
  SellerTransactionImportInput,
  "cardSlug" | "occurredAt"
> & {
  id: string;
  occurredAt: string;
  card: SellerTransactionCard | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerTransactionsResponse = {
  data: SellerTransaction[];
  pagination: Pagination;
};
