import LineItem from "./lineitem";

export default function LineList({ legs, updateStatus, removeLeg }) {
  return (
    <div className="space-y-3">
      {legs.length === 0 && (
        <p className="text-gray-400 text-center">No legs added yet.</p>
      )}

      {legs.map((leg) => (
        <LegItem
          key={leg.id}
          leg={leg}
          updateStatus={updateStatus}
          removeLeg={removeLeg}
        />
      ))}
    </div>
  );
}