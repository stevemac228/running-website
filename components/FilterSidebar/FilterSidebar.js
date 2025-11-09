import FilterChip from "../FilterChip/FilterChip";
import DistanceRangeSlider from "../DistanceRangeSlider/DistanceRangeSlider";

export default function FilterSidebar({
  filterOptions,
  activeFilters,
  onToggleFilter,
  onDistanceRangeChange,
}) {
  // Group filters by category
  const distanceFilters = filterOptions.filter((opt) =>
    ["5k", "10k", "half", "full", "ultra"].includes(opt.key)
  );
  const formatFilters = filterOptions.filter((opt) =>
    ["funRun", "competitive"].includes(opt.key)
  );
  const terrainFilters = filterOptions.filter((opt) =>
    ["trail", "road"].includes(opt.key)
  );
  const featureFilters = filterOptions.filter((opt) =>
    ["medal", "tshirt"].includes(opt.key)
  );

  return (
    <div className="filter-sidebar">
      <h2 className="sidebar-title">Filters</h2>

      {/* Distance Section - Combined slider and categories */}
      <div className="filter-section">
        <label className="filter-section-label">Distance</label>
        <DistanceRangeSlider onChange={onDistanceRangeChange} />
        <div className="filter-chips-vertical filter-chips-vertical-spacing">
          {distanceFilters.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              active={activeFilters.includes(opt.key)}
              onClick={() => onToggleFilter(opt.key)}
            />
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="filter-section">
        <label className="filter-section-label">Format</label>
        <div className="filter-chips-vertical">
          {formatFilters.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              active={activeFilters.includes(opt.key)}
              onClick={() => onToggleFilter(opt.key)}
            />
          ))}
        </div>
      </div>

      {/* Terrain */}
      <div className="filter-section">
        <label className="filter-section-label">Terrain</label>
        <div className="filter-chips-vertical">
          {terrainFilters.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              active={activeFilters.includes(opt.key)}
              onClick={() => onToggleFilter(opt.key)}
            />
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="filter-section">
        <label className="filter-section-label">Features</label>
        <div className="filter-chips-vertical">
          {featureFilters.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              active={activeFilters.includes(opt.key)}
              onClick={() => onToggleFilter(opt.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
