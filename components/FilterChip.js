export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        margin: "0.25rem",
        padding: "0.4rem 0.8rem",
        borderRadius: "9999px",
        border: active ? "2px solid #0070f3" : "1px solid #ccc",
        backgroundColor: active ? "#E6F0FF" : "#fff",
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );
}

