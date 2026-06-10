// memorabilia-client\src\App.tsx

import { useEffect, useState, useCallback } from "react";
import { fetchCards } from "./api";
import Filters from "./components/Filters";
import CardGrid from "./components/CardGrid";
import CardModal from "./components/CardModal";
import CollectionValueCard from "./components/CollectionValueCard";
import { Routes, Route, Link } from "react-router-dom";
import Recommendations from "./pages/Recommendations";
import { useDebounce } from "./hooks/useDebounce";
import type { Card, CardStatus, Pagination, Summary } from "./types/card";
import "./App.css";

type ValuationFilter = "" | "needs" | "valued";
type SortMode = "" | "oldestValued";

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CardStatus | "">("");
  const [valuationFilter, setValuationFilter] = useState<ValuationFilter>("");
  const [sortMode, setSortMode] = useState<SortMode>("");

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [manufacturer, setManufacturer] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");

  const [summary, setSummary] = useState<Summary | null>(null);
  const hasFilters = manufacturer || playerName || yearMin || yearMax;

  const debouncedManufacturer = useDebounce(manufacturer, 400);
  const debouncedPlayerName = useDebounce(playerName, 400);
  const debouncedYearMin = useDebounce(yearMin, 400);
  const debouncedYearMax = useDebounce(yearMax, 400);

  useEffect(() => {
    setPage(1);
  }, [
    manufacturer,
    playerName,
    yearMin,
    yearMax,
    statusFilter,
    valuationFilter,
    sortMode,
  ]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCard(null);
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
    if (statusFilter) params.append("status", statusFilter);
    if (valuationFilter) params.append("valuationStatus", valuationFilter);
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
    statusFilter,
    valuationFilter,
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

  const resetFilters = () => {
    setManufacturer("");
    setPlayerName("");
    setYearMin("");
    setYearMax("");
  };

  const getCount = (status: CardStatus) =>
    summary?.statusCounts.find((s) => s.status === status)?._count.status ?? 0;

  return (
    <div>
      {/* Simple Navigation */}
      <nav className="navbar">
        <Link to="/" className="navLink">
          Home
        </Link>
        <Link to="/recommendations">Recommendations</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div className="container">
              <div className="headerSection">
                <h1>Memorabilia Inventory</h1>

                <div className="collectionSummary">
                  {summary && (
                    <>
                      <CollectionValueCard
                        good={summary.totalGoodConditionValue}
                        perfect={summary.totalPerfectConditionValue}
                        valuedCards={summary.valuedCards}
                        missingValuations={summary.missingValuations}
                        averageValueConfidence={summary.averageValueConfidence}
                        latestValuedAt={summary.latestValuedAt}
                      />

                      <p className="statusFilterLabel">Filter by Status:</p>

                      <div>
                        <div className="statusFilterContainer">
                          <p
                            className={`statusFilter ${statusFilter === "NEW" ? "active" : ""}`}
                            onClick={() => setStatusFilter("NEW")}
                          >
                            NEW: {getCount("NEW")}
                          </p>

                          <p
                            className={`statusFilter ${statusFilter === "LISTED" ? "active" : ""}`}
                            onClick={() => setStatusFilter("LISTED")}
                          >
                            LISTED: {getCount("LISTED")}
                          </p>

                          <p
                            className={`statusFilter ${statusFilter === "GRADED" ? "active" : ""}`}
                            onClick={() => setStatusFilter("GRADED")}
                          >
                            GRADED: {getCount("GRADED")}
                          </p>

                          <p
                            className={`statusFilter ${statusFilter === "" ? "active" : ""}`}
                            onClick={() => setStatusFilter("")}
                          >
                            ALL
                          </p>
                        </div>
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
                setManufacturer={setManufacturer}
                setPlayerName={setPlayerName}
                setYearMin={setYearMin}
                setYearMax={setYearMax}
                hasFilters={!!hasFilters}
                resetFilters={resetFilters}
              />

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
                />
              )}
            </div>
          }
        />

        <Route path="/recommendations" element={<Recommendations />} />
      </Routes>
    </div>
  );
}

export default App;
