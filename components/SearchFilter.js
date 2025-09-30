export default function SearchFilter({ onSearch }) {
  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search by name or city..."
        className="border p-2 rounded w-full"
        onChange={e => onSearch(e.target.value)}
      />
    </div>
  );
}
