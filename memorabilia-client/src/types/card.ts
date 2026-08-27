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
  status: "NEW" | "LISTED" | "GRADED";
  imageFrontUrl: string | null;
  imageBackUrl: string | null;
  location: string | null;
  listingMarketplace: string | null;
  listingUrl: string | null;
  askingPriceCents: number | null;
  listedAt: string | null;
  soldAt: string | null;
};

export type CardStatus = Card["status"];

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
