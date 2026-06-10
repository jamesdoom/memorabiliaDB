// memorabilia-client\src\types\card.ts

export type Card = {
  id: string;
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
