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

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CardStatus | "">("");

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
  }, [manufacturer, playerName, yearMin, yearMax]);

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

    return `?${params.toString()}`;
  }, [
    page,
    debouncedManufacturer,
    debouncedPlayerName,
    debouncedYearMin,
    debouncedYearMax,
    statusFilter,
  ]);

  const loadCards = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchCards(buildQuery());
      setCards(response.data);
      setPagination(response.pagination);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load cards:", error);
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
