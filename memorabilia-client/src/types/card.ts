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
  serialNumber: string | null;
  quantity: number;
  status: "NEW" | "LISTED" | "GRADED";
  imageFrontUrl: string | null;
  imageBackUrl: string | null;
  location: string | null;
};

export type Pagination = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};
