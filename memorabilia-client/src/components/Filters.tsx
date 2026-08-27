// memorabilia-client\src\components\Filters.tsx

type Props = {
  manufacturer: string;
  playerName: string;
  yearMin: string;
  yearMax: string;
  location: string;
  locationType: string;

  setManufacturer: (v: string) => void;
  setPlayerName: (v: string) => void;
  setYearMin: (v: string) => void;
  setYearMax: (v: string) => void;
  setLocation: (v: string) => void;
  setLocationType: (v: string) => void;

  hasFilters: boolean;
  resetFilters: () => void;
};

export default function Filters({
  manufacturer,
  playerName,
  yearMin,
  yearMax,
  location,
  locationType,

  setManufacturer,
  setPlayerName,
  setYearMin,
  setYearMax,
  setLocation,
  setLocationType,
  hasFilters,
  resetFilters,
}: Props) {
  return (
    <div className="searchBar">
      {/* Search */}
      <input
        className="searchInput"
        type="text"
        placeholder="Search player..."
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />

      {/* Manufacturer */}
      <input
        className="filterInput"
        type="text"
        placeholder="Manufacturer"
        value={manufacturer}
        onChange={(e) => setManufacturer(e.target.value)}
      />

      {/* Year range */}
      <input
        className="filterInput small"
        type="number"
        placeholder="Min"
        value={yearMin}
        onChange={(e) => setYearMin(e.target.value)}
      />

      <input
        className="filterInput"
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <select
        className="filterInput"
        value={locationType}
        onChange={(e) => setLocationType(e.target.value)}
      >
        <option value="">Any location</option>
        <option value="BOX">Box</option>
        <option value="SHELF">Shelf</option>
        <option value="BINDER">Binder</option>
        <option value="CONSIGNMENT">Consignment</option>
        <option value="GRADING_SUBMISSION">Grading batch</option>
        <option value="OTHER">Other</option>
      </select>

      <input
        className="filterInput small"
        type="number"
        placeholder="Max"
        value={yearMax}
        onChange={(e) => setYearMax(e.target.value)}
      />

      {/* Reset */}
      {hasFilters && (
        <button className="resetBtn" onClick={resetFilters}>
          Reset
        </button>
      )}
    </div>
  );
}
