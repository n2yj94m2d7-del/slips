const statusOptions = [
  { value: "pending", label: "waiting" },
  { value: "won", label: "hit" },
  { value: "lost", label: "miss" },
];

export default function LineItem({ line, updateStatus, removeLine }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex-1 space-y-1">
        <p className="font-semibold text-lg">{line.player}</p>
        <p className="text-sm text-gray-300">{line.prop}</p>
        {line.odds && (
          <p className="text-xs text-gray-400">Odds — {line.odds}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={line.status}
          onChange={(e) => updateStatus(line.id, e.target.value)}
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => removeLine(line.id)}
          className="rounded-lg border border-red-400/70 text-red-300 px-3 py-2 text-base font-bold hover:bg-red-500/10 transition"
        >
          ×
        </button>
      </div>
    </div>
  );
}
