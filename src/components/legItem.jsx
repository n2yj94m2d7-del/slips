export default function LegItem({ leg, updateStatus, removeLeg }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow flex items-center justify-between">
      <div>
        <h3 className="text-white font-bold">{leg.player}</h3>
        <p className="text-gray-300 text-sm">{leg.prop} — {leg.line}</p>
        <p className="text-gray-400 text-xs">Odds: {leg.odds}</p>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => updateStatus(leg.id, "won")}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs"
          >
            Won
          </button>

          <button
            onClick={() => updateStatus(leg.id, "lost")}
            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
          >
            Lost
          </button>

          <button
            onClick={() => updateStatus(leg.id, "pending")}
            className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
          >
            Pending
          </button>

          <button
            onClick={() => removeLeg(leg.id)}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
          >
            Remove
          </button>
        </div>
      </div>

      <div className={`font-bold text-lg ${
        leg.status === "won" ? "text-green-400" : 
        leg.status === "lost" ? "text-red-400" : 
        "text-yellow-400"
      }`}>
        {leg.status.toUpperCase()}
      </div>
    </div>
  );
}