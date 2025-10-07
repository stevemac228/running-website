export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`filter-chip ${active ? "active" : ""}`}
    >
      {label}
    </button>
  );
}
