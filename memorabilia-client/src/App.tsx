// memorabilia-client\src\App.tsx

import { useEffect, useState, useCallback } from "react";
import { fetchCards, fetchSellerSummary } from "./api";
import Filters from "./components/Filters";
import CardGrid from "./components/CardGrid";
import CardModal from "./components/CardModal";
import AddCardModal from "./components/AddCardModal";
import CollectionValueCard from "./components/CollectionValueCard";
import DashboardLayout from "./components/DashboardLayout";
import { InventoryValueChart } from "./components/DashboardCharts";
import SellerCsvImport from "./components/SellerCsvImport";
import SellerSummaryCard from "./components/SellerSummaryCard";
import { Routes, Route } from "react-router-dom";
import Recommendations from "./pages/Recommendations";
import Transactions from "./pages/Transactions";
import Grading from "./pages/Grading";
import Reports from "./pages/Reports";
import { useDebounce } from "./hooks/useDebounce";
import { portfolioReadOnly, portfolioReadOnlyMessage } from "./access";
import type {
  Card,
  CardStatus,
  Pagination,
  SellerSummary,
  Summary,
} from "./types/card";
import "./App.css";

type ValuationFilter = "" | "needs" | "valued";
type ListingHealthFilter = "" | "stale";
type SortMode = "" | "oldestValued";

const statusOptions: CardStatus[] = [
  "NEW",
  "READY_TO_LIST",
  "LISTED",
  "SOLD",
  "SHIPPED",
  "GRADED",
  "ARCHIVED",
];

function formatStatus(status: CardStatus) {
  return status.replaceAll("_", " ");
}

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CardStatus | "">("");
  const [valuationFilter, setValuationFilter] = useState<ValuationFilter>("");
  const [listingHealthFilter, setListingHealthFilter] =
    useState<ListingHealthFilter>("");
  const [sortMode, setSortMode] = useState<SortMode>("");

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [manufacturer, setManufacturer] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [sellerSummary, setSellerSummary] = useState<SellerSummary | null>(
    null,
  );
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerError, setSellerError] = useState<string | null>(null);
  const hasFilters =
    manufacturer || playerName || yearMin || yearMax || location || locationType;

  const debouncedManufacturer = useDebounce(manufacturer, 400);
  const debouncedPlayerName = useDebounce(playerName, 400);
  const debouncedYearMin = useDebounce(yearMin, 400);
  const debouncedYearMax = useDebounce(yearMax, 400);
  const debouncedLocation = useDebounce(location, 400);

  useEffect(() => {
    setPage(1);
  }, [
    manufacturer,
    playerName,
    yearMin,
    yearMax,
    statusFilter,
    valuationFilter,
    listingHealthFilter,
    sortMode,
  ]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCard(null);
        setAddingCard(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    setIsFlipped(false);
  }, [selectedCard]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    params.append("page", String(page));

    if (debouncedManufacturer)
      params.append("manufacturer", debouncedManufacturer);

    if (debouncedPlayerName) params.append("playerName", debouncedPlayerName);

    if (debouncedYearMin) params.append("yearMin", debouncedYearMin);

    if (debouncedYearMax) params.append("yearMax", debouncedYearMax);
    if (debouncedLocation) params.append("location", debouncedLocation);
    if (locationType) params.append("locationType", locationType);
    if (statusFilter) params.append("status", statusFilter);
    if (valuationFilter) params.append("valuationStatus", valuationFilter);
    if (listingHealthFilter)
      params.append("listingHealth", listingHealthFilter);
    if (sortMode === "oldestValued") {
      params.append("sortBy", "lastValuedAt");
      params.append("order", "asc");
    }

    return `?${params.toString()}`;
  }, [
    page,
    debouncedManufacturer,
    debouncedPlayerName,
    debouncedYearMin,
    debouncedYearMax,
    debouncedLocation,
    locationType,
    statusFilter,
    valuationFilter,
    listingHealthFilter,
    sortMode,
  ]);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetchCards(buildQuery());
      setCards(response.data);
      setPagination(response.pagination);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load cards:", error);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load cards",
      );
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const loadSellerSummary = useCallback(async () => {
    setSellerLoading(true);
    setSellerError(null);

    try {
      const response = await fetchSellerSummary();
      setSellerSummary(response);
    } catch (error) {
      setSellerError(
        error instanceof Error ? error.message : "Failed to load seller summary",
      );
    } finally {
      setSellerLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellerSummary();
  }, [loadSellerSummary]);

  const resetFilters = () => {
    setManufacturer("");
    setPlayerName("");
    setYearMin("");
    setYearMax("");
    setLocation("");
    setLocationType("");
  };

  const getCount = (status: CardStatus) =>
    summary?.statusCounts.find((s) => s.status === status)?._count.status ?? 0;

  return (
    <div>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route
            path="/"
            element={
            <div className="container">
              <div className="headerSection">
                <div className="pageHeader">
                  <div>
                    <p className="sellerEyebrow">Inventory</p>
                    <h1>Inventory Command Center</h1>
                  </div>
                </div>

                <div className="collectionSummary">
                  {portfolioReadOnly && (
                    <div className="portfolioReadOnlyBanner" role="note">
                      <strong>Portfolio demo</strong>
                      <span>{portfolioReadOnlyMessage}</span>
                    </div>
                  )}

                  <SellerSummaryCard
                    summary={sellerSummary}
                    loading={sellerLoading}
                    error={sellerError}
                  />

                  <SellerCsvImport
                    onImported={loadSellerSummary}
                    readOnly={portfolioReadOnly}
                  />

                  {summary && (
                    <>
                      <CollectionValueCard
                        good={summary.totalGoodConditionValue}
                        perfect={summary.totalPerfectConditionValue}
                        valuedCards={summary.valuedCards}
                        missingValuations={summary.missingValuations}
                        averageValueConfidence={summary.averageValueConfidence}
                        latestValuedAt={summary.latestValuedAt}
                        staleListingCount={summary.staleListingCount}
                      />

                      <section className="operationsPanel inventoryChartPanel">
                        <div className="sectionHeader">
                          <h2>Inventory Value</h2>
                        </div>
                        <InventoryValueChart summary={summary} />
                      </section>

                      <p className="statusFilterLabel">Filter by Status:</p>

                      <div>
                        <div className="statusFilterContainer">
                          {statusOptions.map((status) => (
                            <p
                              key={status}
                              className={`statusFilter ${statusFilter === status ? "active" : ""}`}
                              onClick={() => setStatusFilter(status)}
                            >
                              {formatStatus(status)}: {getCount(status)}
                            </p>
                          ))}

                          <p
                            className={`statusFilter ${statusFilter === "" ? "active" : ""}`}
                            onClick={() => setStatusFilter("")}
                          >
                            ALL
                          </p>
                        </div>
                      </div>

                      <p className="statusFilterLabel">Listing Workflow:</p>

                      <div className="statusFilterContainer">
                        <p
                          className={`statusFilter ${listingHealthFilter === "stale" ? "active" : ""}`}
                          onClick={() =>
                            setListingHealthFilter((current) =>
                              current === "stale" ? "" : "stale",
                            )
                          }
                        >
                          Stale listings: {summary.staleListingCount}
                        </p>
                      </div>

                      <p className="statusFilterLabel">Valuation Workflow:</p>

                      <div className="statusFilterContainer">
                        <p
                          className={`statusFilter ${valuationFilter === "needs" ? "active" : ""}`}
                          onClick={() =>
                            setValuationFilter((current) =>
                              current === "needs" ? "" : "needs",
                            )
                          }
                        >
                          Needs valuation: {summary.missingValuations}
                        </p>

                        <p
                          className={`statusFilter ${valuationFilter === "valued" ? "active" : ""}`}
                          onClick={() =>
                            setValuationFilter((current) =>
                              current === "valued" ? "" : "valued",
                            )
                          }
                        >
                          Valued: {summary.valuedCards}
                        </p>

                        <p
                          className={`statusFilter ${sortMode === "oldestValued" ? "active" : ""}`}
                          onClick={() =>
                            setSortMode((current) =>
                              current === "oldestValued" ? "" : "oldestValued",
                            )
                          }
                        >
                          Oldest valuation first
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Filters
                manufacturer={manufacturer}
                playerName={playerName}
                yearMin={yearMin}
                yearMax={yearMax}
                location={location}
                locationType={locationType}
                setManufacturer={setManufacturer}
                setPlayerName={setPlayerName}
                setYearMin={setYearMin}
                setYearMax={setYearMax}
                setLocation={setLocation}
                setLocationType={setLocationType}
                hasFilters={!!hasFilters}
                resetFilters={resetFilters}
              />

              <div className="inventoryToolbar">
                <button
                  type="button"
                  className="primaryButton"
                  disabled={portfolioReadOnly}
                  title={
                    portfolioReadOnly ? portfolioReadOnlyMessage : undefined
                  }
                  onClick={() => {
                    if (portfolioReadOnly) return;
                    setNotice(null);
                    setAddingCard(true);
                  }}
                >
                  Add card
                </button>
              </div>

              {notice && (
                <div className="successAlert" role="status">
                  <span>{notice}</span>
                  <button type="button" onClick={() => setNotice(null)}>
                    Dismiss
                  </button>
                </div>
              )}

              {loading && (
                <div className="uploadSpinnerContainer">
                  <div className="uploadSpinner"></div>
                </div>
              )}

              {loadError && (
                <div className="inlineAlert" role="alert">
                  <span>{loadError}</span>
                  <button type="button" onClick={loadCards}>
                    Retry
                  </button>
                </div>
              )}

              <CardGrid cards={cards} onSelect={setSelectedCard} />

              {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}

              {selectedCard && (
                <CardModal
                  card={selectedCard}
                  setSelectedCard={setSelectedCard}
                  uploading={uploading}
                  setUploading={setUploading}
                  isFlipped={isFlipped}
                  setIsFlipped={setIsFlipped}
                  loadCards={loadCards}
                  readOnly={portfolioReadOnly}
                  onDeleted={async () => {
                    setSelectedCard(null);
                    setNotice("Card deleted successfully.");

                    if (page === 1) {
                      await loadCards();
                    } else {
                      setPage(1);
                    }
                  }}
                />
              )}

              {addingCard && (
                <AddCardModal
                  onClose={() => setAddingCard(false)}
                  onCreated={async (card) => {
                    setAddingCard(false);
                    setSelectedCard(card);
                    setNotice(`${card.playerName} was added successfully.`);
                    await loadCards();
                  }}
                />
              )}
            </div>
            }
          />

          <Route path="/recommendations" element={<Recommendations />} />
          <Route
            path="/transactions"
            element={<Transactions readOnly={portfolioReadOnly} />}
          />
          <Route
            path="/sales"
            element={
              <Transactions initialType="SALE" readOnly={portfolioReadOnly} />
            }
          />
          <Route
            path="/purchases"
            element={
              <Transactions
                initialType="PURCHASE"
                readOnly={portfolioReadOnly}
              />
            }
          />
          <Route path="/grading" element={<Grading readOnly={portfolioReadOnly} />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
