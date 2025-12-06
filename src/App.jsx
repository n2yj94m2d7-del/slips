import { useEffect, useMemo, useState, useRef } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  List,
  Plus,
  ChevronUp,
  Trash2,
  TrendingUp,
  User,
  ChevronDown,
} from "lucide-react";
import Logo from "./components/Logo";
import { localRoster } from "./data/nflRoster";

const fallbackPlayers = [
  "Patrick Mahomes",
  "Josh Allen",
  "Jalen Hurts",
  "Lamar Jackson",
  "Joe Burrow",
  "Justin Herbert",
  "Dak Prescott",
  "C.J. Stroud",
  "Tua Tagovailoa",
  "Kirk Cousins",
  "Aaron Rodgers",
  "Christian McCaffrey",
  "Bijan Robinson",
  "Saquon Barkley",
  "Jonathan Taylor",
  "Derrick Henry",
  "Alvin Kamara",
  "Nick Chubb",
  "Tyreek Hill",
  "Justin Jefferson",
  "Ja'Marr Chase",
  "A.J. Brown",
  "Stefon Diggs",
  "CeeDee Lamb",
  "Amon-Ra St. Brown",
  "Puka Nacua",
  "Garrett Wilson",
  "Davante Adams",
  "Travis Kelce",
  "George Kittle",
  "Mark Andrews",
  "Kyle Pitts",
  "Cooper Kupp",
  "Mike Evans",
  "Jaylen Waddle",
  "Calvin Ridley",
  "Deebo Samuel",
  "Chris Olave",
  "Drake London",
  "Drake Maye",
  "Drake Jackson",
  "Drake Thomas",
  "Drake Stoops",
];

const nflTeams = [
  { abbr: "ARI", name: "Arizona Cardinals" },
  { abbr: "ATL", name: "Atlanta Falcons" },
  { abbr: "BAL", name: "Baltimore Ravens" },
  { abbr: "BUF", name: "Buffalo Bills" },
  { abbr: "CAR", name: "Carolina Panthers" },
  { abbr: "CHI", name: "Chicago Bears" },
  { abbr: "CIN", name: "Cincinnati Bengals" },
  { abbr: "CLE", name: "Cleveland Browns" },
  { abbr: "DAL", name: "Dallas Cowboys" },
  { abbr: "DEN", name: "Denver Broncos" },
  { abbr: "DET", name: "Detroit Lions" },
  { abbr: "GB", name: "Green Bay Packers" },
  { abbr: "HOU", name: "Houston Texans" },
  { abbr: "IND", name: "Indianapolis Colts" },
  { abbr: "JAX", name: "Jacksonville Jaguars" },
  { abbr: "KC", name: "Kansas City Chiefs" },
  { abbr: "LV", name: "Las Vegas Raiders" },
  { abbr: "LAC", name: "Los Angeles Chargers" },
  { abbr: "LAR", name: "Los Angeles Rams" },
  { abbr: "MIA", name: "Miami Dolphins" },
  { abbr: "MIN", name: "Minnesota Vikings" },
  { abbr: "NE", name: "New England Patriots" },
  { abbr: "NO", name: "New Orleans Saints" },
  { abbr: "NYG", name: "New York Giants" },
  { abbr: "NYJ", name: "New York Jets" },
  { abbr: "PHI", name: "Philadelphia Eagles" },
  { abbr: "PIT", name: "Pittsburgh Steelers" },
  { abbr: "SF", name: "San Francisco 49ers" },
  { abbr: "SEA", name: "Seattle Seahawks" },
  { abbr: "TB", name: "Tampa Bay Buccaneers" },
  { abbr: "TEN", name: "Tennessee Titans" },
  { abbr: "WAS", name: "Washington Commanders" },
];

const statOptions = [
  "Passing Yards",
  "Rushing Yards",
  "Receiving Yards",
  "Receptions",
  "Passing TDs",
  "Rushing TDs",
  "Receiving TDs",
  "Interceptions Thrown",
  "Completions",
  "Passing Attempts",
  "Rushing Attempts",
  "Carries",
  "Targets",
  "Longest Pass",
  "Longest Rush",
  "Longest Reception",
  "Sacks Recorded",
  "Tackles + Assists",
  "Field Goals Made",
  "Extra Points Made",
];

const defaultModes = ["add", "tracking"];

export default function App() {
  const [mode, setMode] = useState("add");
  const [legs, setLegs] = useState([]);
  const [queuedLegs, setQueuedLegs] = useState([]);
  const addPanelRef = useRef(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const tickRef = useRef(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);

  const liveCount = useMemo(
    () => legs.filter((leg) => leg.status === "live").length,
    [legs]
  );

  const addLegToQueue = (leg) => {
    setQueuedLegs((prev) => [...prev, leg]);
    setShowQueueDrawer(true);
  };

  const moveQueueToTracking = () => {
    if (!queuedLegs.length) return;
    setLegs((prev) => [...prev, ...queuedLegs]);
    setQueuedLegs([]);
    setMode("tracking");
  };

  const updateStatus = (id, status) => {
    setLegs((prev) =>
      prev.map((leg) =>
        leg.id === id ? { ...leg, status } : leg
      )
    );
  };

  const removeLeg = (id) => {
    setLegs((prev) => prev.filter((leg) => leg.id !== id));
  };

  const clearLegs = () => {
    setLegs([]);
  };

  const refreshLiveStats = async () => {
    try {
      const scoreboard = await fetchScoreboard();
      const now = new Date();

      if (!scoreboard.length) {
        setLegs((prev) =>
          prev.map((leg) => ({
            ...leg,
            status: "unavailable",
            result: leg.result || 0,
          }))
        );
        setLastUpdate(now);
        return;
      }

      const eventMap = mapEventsByTeam(scoreboard);

      setLegs((prev) => {
        const legsWithEvent = prev.map((leg) => {
          if (leg.eventId) return leg;
          const event = eventMap[leg.team?.toUpperCase?.() || ""];
          if (event) return { ...leg, eventId: event.id };
          return { ...leg };
        });

        const eventsToFetch = Array.from(
          new Set(
            legsWithEvent
              .map((leg) => leg.eventId)
              .filter(Boolean)
          )
        );

        return legsWithEvent.map((leg) => {
          if (!leg.eventId || !eventsToFetch.includes(leg.eventId)) {
            return {
              ...leg,
              status: "unavailable",
              result: leg.result || 0,
            };
          }
          return leg;
        });
      });

      const eventsToFetch = Array.from(
        new Set(
          scoreboard
            .map((e) => e.id)
            .filter(Boolean)
        )
      );
      const summaries = await fetchSummaries(eventsToFetch);
      const summaryMap = summaries.reduce((acc, item) => {
        acc[item.eventId] = item.summary;
        return acc;
      }, {});

      setLegs((prev) =>
        prev.map((leg) => {
          const summary = leg.eventId ? summaryMap[leg.eventId] : null;
          if (!summary) {
            return {
              ...leg,
              status: "unavailable",
              result: leg.result || 0,
            };
          }

          const gameState =
            summary?.header?.competitions?.[0]?.status?.type?.state || "pre";
          const isLive = gameState === "in";

          const currentValue = getPlayerStatValue(
            summary,
            leg.playerId,
            leg.player,
            leg.statType || leg.prop
          );

          const lineVal = leg.line || 0;
          let status = leg.status;
          if (isLive) {
            status = "live";
          } else {
            status = "unavailable";
          }

          return {
            ...leg,
            result:
              currentValue === null || currentValue === undefined
                ? leg.result || 0
                : currentValue,
            status,
          };
        })
      );

      setLastUpdate(now);
    } catch (err) {
      console.error("refresh error", err);
      setLegs((prev) =>
        prev.map((leg) => ({
          ...leg,
          status: "unavailable",
          result: leg.result || 0,
        }))
      );
    setLastUpdate(new Date());
  }
  };

  useEffect(() => {
    tickRef.current = setInterval(refreshLiveStats, 20000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen px-4 pb-24 sm:px-6 md:px-8 lg:px-12">
      {showSplash && <Splash />}
      <div className="mx-auto max-w-4xl space-y-6">
        <Header liveCount={liveCount} />

        <ModeTabs
          mode={mode}
          onChange={setMode}
          queuedCount={queuedLegs.length}
        />

        {mode === "add" && (
          <AddPanel
            onSubmit={addLegToQueue}
            panelRef={addPanelRef}
          />
        )}

        {mode === "tracking" && (
          <TrackList
            legs={legs}
            updateStatus={updateStatus}
            removeLeg={removeLeg}
            clearLegs={clearLegs}
            onAddClick={() => setMode("add")}
            onManualRefresh={refreshLiveStats}
            lastUpdate={lastUpdate}
            queuedLegs={queuedLegs}
            onSendQueued={moveQueueToTracking}
          />
        )}
      </div>
      {queuedLegs.length > 0 && (
        <QueueDrawer
          items={queuedLegs}
          open={showQueueDrawer}
          onToggle={() => setShowQueueDrawer((o) => !o)}
          onRemove={(id) =>
            setQueuedLegs((prev) => prev.filter((leg) => leg.id !== id))
          }
          onSend={() => {
            moveQueueToTracking();
            setShowQueueDrawer(false);
          }}
          onAddMore={() => {
            setMode("add");
            setShowQueueDrawer(false);
          }}
        />
      )}
    </div>
  );
}

function Header({ liveCount }) {
  return (
    <header className="flex items-center justify-center pt-6">
      <Logo />
    </header>
  );
}

function Splash() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)] pointer-events-none">
      <div className="flex flex-col items-center gap-2 animate-splash">
        <Logo />
        <p className="text-sm tracking-[0.14em] text-gray-300 lowercase">
          track props live
        </p>
      </div>
    </div>
  );
}

function ModeTabs({ mode, onChange, queuedCount = 0 }) {
  return (
    <div className="flex rounded-3xl bg-[var(--panel)] p-1 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.04)]">
      {defaultModes.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
            mode === key
              ? "bg-[var(--accent)] text-gray-950"
              : "text-gray-300 hover:bg-white/5"
          }`}
        >
          {key === "add" ? (
            <Plus className="h-4 w-4" />
          ) : (
            <List className="h-4 w-4" />
          )}
          {key === "add" ? "Add to slip" : "Track slips"}
          {key === "tracking" && (
            <span
              className={`ml-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs ${
                mode === key
                  ? "bg-[var(--accent-2)] text-white"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              {queuedCount > 0 ? `${queuedCount} in slip` : "•"}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ActionCard({ icon, title, subtitle, onClick, tone = "green" }) {
  const tones = {
    green: "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]",
    blue: "bg-blue-500/10 text-blue-200 border border-blue-500/30",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl p-5 text-left transition hover:translate-y-[-2px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] ${tones[tone]} bg-[var(--card)]`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-lg">
        {icon}
      </div>
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </button>
  );
}

function TrackList({
  legs,
  updateStatus,
  removeLeg,
  clearLegs,
  onAddClick,
  onManualRefresh,
  lastUpdate,
  queuedLegs = [],
  onSendQueued,
}) {
  if (!legs.length) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[var(--panel)] p-8 text-center text-gray-300 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
        <p className="text-lg font-semibold text-white">
          No slips yet
        </p>
        <p className="text-sm text-gray-400">
          Add a line to your slip to start monitoring it live.
        </p>
        {queuedLegs.length > 0 && (
          <div className="mt-4 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-2)]">
            {queuedLegs.length} in slip and ready to send.
          </div>
        )}
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-gray-950 hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Add to slip
          </button>
          {queuedLegs.length > 0 && (
            <button
              onClick={onSendQueued}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] px-4 py-2 text-sm font-semibold text-[var(--accent-2)] hover:bg-[var(--accent-soft)] transition"
            >
              <List className="h-4 w-4" />
              Track slip
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queuedLegs.length > 0 && (
        <div className="flex flex-col gap-2 rounded-3xl border border-[var(--accent-border)] bg-[var(--card-soft)] p-4 text-sm text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <List className="h-4 w-4 text-[var(--accent-2)]" />
            <span>
              {queuedLegs.length} {queuedLegs.length === 1 ? "line" : "lines"} in slip ready to track.
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={onAddClick}
              className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/5 transition"
            >
              Review in add tab
            </button>
            <button
              onClick={onSendQueued}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[#0b0b18] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Track slip now
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <button
            onClick={onManualRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] px-3 py-1 text-[var(--accent-2)] hover:bg-[var(--accent-soft)] transition"
          >
            Refresh now
          </button>
          <button
            onClick={clearLegs}
            className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 px-3 py-1 text-rose-200 transition hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete all
          </button>
        </div>
        <span>
          {lastUpdate
            ? `Last update: ${lastUpdate.toLocaleTimeString()}`
            : "Live auto-refreshing"}
        </span>
      </div>
      {legs.map((leg) => (
        <LegCard
          key={leg.id}
          leg={leg}
          updateStatus={updateStatus}
          removeLeg={removeLeg}
        />
      ))}
    </div>
  );
}

function QueueDrawer({ items, open, onToggle, onRemove, onSend, onAddMore }) {
  const count = items.length;
  if (!count) return null;

  return (
    <>
      {!open && (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center">
          <button
            onClick={onToggle}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.5)] transition hover:bg-white/5"
          >
            <span>Slip ({count})</span>
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="pointer-events-auto w-full max-w-4xl rounded-t-3xl border border-white/10 bg-[var(--panel)] shadow-[0_30px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div>
              <p className="text-base font-semibold text-white">
                Slip ({count})
              </p>
              <p className="text-xs text-gray-400">
                Pull up to review and track your picks.
              </p>
            </div>
            <button
              onClick={onSend}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[#0b0b18] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Track slip
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
            {items.map((leg) => (
              <div
                key={leg.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-[#0f1325] px-4 py-3 text-sm text-white"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{leg.player}</span>
                  <span className="text-xs text-gray-400">
                    {leg.direction ? leg.direction.toUpperCase() : ""}{" "}
                    {leg.prop} {leg.line ? `@ ${leg.line}` : ""}
                  </span>
                </div>
                <button
                  onClick={() => onRemove?.(leg.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-white/5 px-4 py-3">
            <button
              onClick={onAddMore}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Add more
            </button>
            <button
              onClick={onSend}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[#0b0b18] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Track slip
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function LegCard({ leg, updateStatus, removeLeg }) {
  const statusTone =
    leg.status === "hit"
      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
      : leg.status === "miss"
      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
      : leg.status === "unavailable"
      ? "bg-gray-800 text-gray-300 border border-gray-700"
      : "bg-amber-500/10 text-amber-300 border border-amber-500/30";

  const progress =
    leg.line && leg.result
      ? Math.min(100, Math.round((leg.result / leg.line) * 100))
      : 0;
  const progressTone =
    progress >= 100 || leg.status === "hit"
      ? "bg-emerald-400"
      : "bg-rose-500";

  return (
    <div className="rounded-3xl border border-[rgba(0,255,180,0.15)] bg-[var(--card-strong)] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
            <CheckCircle2 className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{leg.player}</p>
            <p className="text-sm text-gray-400">{leg.league || "NFL"}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-200">
              <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
              {leg.direction?.toUpperCase() || "OVER"} {leg.prop}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone}`}>
          {leg.status === "hit"
            ? "Hit"
            : leg.status === "miss"
            ? "Miss"
            : "Live"}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2 text-white">
        <span className="text-3xl font-semibold">
          {leg.result || 0}
        </span>
        {leg.line && (
          <span className="text-lg text-gray-500">/ {leg.line}</span>
        )}
      </div>

      <div className="mt-3 h-3 rounded-full bg-[#111]">
        <div
          className={`h-full rounded-full transition-all ${progressTone}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            Status
          </span>
          <StatusBadge status={leg.status} />
        </div>
        <button
          onClick={() => removeLeg(leg.id)}
          className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 px-3 py-1 text-rose-300 transition hover:bg-rose-500/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "hit"
      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
      : status === "miss"
      ? "bg-rose-500/20 text-rose-200 border border-rose-500/40"
      : status === "unavailable"
      ? "bg-gray-500/20 text-gray-300 border border-gray-500/40"
      : "bg-amber-500/20 text-amber-200 border border-amber-500/40";

  const label =
    status === "hit"
      ? "Hit"
      : status === "miss"
      ? "Miss"
      : status === "unavailable"
      ? "Unavailable"
      : "Live";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

function AddPanel({ onSubmit, panelRef }) {
  const [type, setType] = useState("player");
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [teamQuery, setTeamQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [totalMarket, setTotalMarket] = useState("Game Total");
  const [prop, setProp] = useState("");
  const [line, setLine] = useState("");
  const [direction, setDirection] = useState("over");
  const [openStat, setOpenStat] = useState(false);
  const statRef = useRef(null);
  const [playerResults, setPlayerResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suppressResults, setSuppressResults] = useState(false);
  const [roster, setRoster] = useState(localRoster);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterLoaded, setRosterLoaded] = useState(true);
  const [livePlayers, setLivePlayers] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  // Load full NFL roster once (Sleeper) for local filtering
  useEffect(() => {
    let ignore = false;
    const loadRoster = async () => {
      if (rosterLoading) return;
      setRosterLoading(true);
      try {
        const res = await fetch("https://api.sleeper.app/v1/players/nfl");
        if (!res.ok) throw new Error("roster fetch failed");
        const data = await res.json();
        const pool =
          Object.values(data)
            .filter((p) => p?.active && !p?.retired)
            .map((p) => ({
              id: p.player_id || p.full_name || p.last_name || Math.random(),
              name:
                p.full_name ||
                `${p.first_name || ""} ${p.last_name || ""}`.trim(),
              team: p.team || "NFL",
              position: p.position || "",
            })) || [];
        if (!ignore) {
          const merged = dedupeRoster([...pool, ...localRoster]);
          setRoster(merged);
          setRosterLoaded(true);
        }
      } catch (err) {
        if (!ignore) {
          setRosterLoaded(true);
        }
      } finally {
        if (!ignore) setRosterLoading(false);
      }
    };
    loadRoster();
    return () => {
      ignore = true;
    };
  }, [rosterLoaded, rosterLoading]);

  // Load live players from ESPN scoreboard/summary for better matching
  useEffect(() => {
    let ignore = false;
    const loadLive = async () => {
      try {
        setLiveLoading(true);
        const events = await fetchScoreboard();
        const ids = events.map((e) => e.id).filter(Boolean).slice(0, 8); // cap to reduce load
        const summaries = await fetchSummaries(ids);
        const allPlayers = summaries.flatMap((s) =>
          extractPlayersFromSummary(s.summary)
        );
        if (!ignore) {
          setLivePlayers(dedupeRoster(allPlayers));
        }
      } catch (err) {
        if (!ignore) {
          setLivePlayers([]);
        }
      } finally {
        if (!ignore) setLiveLoading(false);
      }
    };
    loadLive();
    const interval = setInterval(loadLive, 60000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!playerQuery.trim()) {
      setPlayerResults([]);
      return;
    }

    if (suppressResults) {
      setPlayerResults([]);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(() => {
      setIsSearching(true);
      const pool = dedupeRoster([...livePlayers, ...roster]);
      const filtered = filterRoster(pool, playerQuery);
      const next =
        filtered.length > 0
          ? filtered.slice(0, 10)
          : filterFallback(playerQuery);
      setPlayerResults(next);
      setIsSearching(false);
    }, 200); // debounce

    return () => {
      clearTimeout(timeout);
    };
  }, [playerQuery, roster, livePlayers, suppressResults]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      (type === "player" && (!playerQuery.trim() || !prop.trim())) ||
      (type !== "player" && (!teamQuery.trim() || (type !== "winner" && !line)))
    ) {
      return;
    }

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const base = {
      id,
      line: line ? Number(line) : undefined,
      result: 0,
      direction: type === "winner" ? undefined : direction,
      status: "unavailable",
      type,
    };

    if (type === "player") {
      onSubmit({
        ...base,
        player: playerQuery.trim(),
        playerId: selectedPlayer?.id,
        team: selectedPlayer?.team || "NFL",
        statType: prop.trim(),
        prop: prop.trim(),
      });
    } else {
      const teamName = selectedTeam?.name || teamQuery.trim();
      const teamAbbr = selectedTeam?.abbr || selectedTeam?.team || "";
      const marketLabel =
        type === "spread"
          ? "Spread"
          : type === "total"
          ? totalMarket
          : "Winner";

      onSubmit({
        ...base,
        player: teamName,
        team: teamAbbr || teamName,
        prop: marketLabel,
        statType: marketLabel,
      });
    }

    setPlayerQuery("");
    setSelectedPlayer(null);
    setTeamQuery("");
    setSelectedTeam(null);
    setProp("");
    setLine("");
  };

  return (
    <div
      ref={panelRef}
      className="rounded-3xl border border-white/5 bg-[var(--panel)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] mb-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold text-white">Add picks</p>
          <p className="text-sm text-gray-400">
            Add a bet to your slip to start monitoring. Current stats will
            update automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent)] border border-[var(--accent-border)]">
          <Camera className="h-4 w-4" />
          Scan slip coming soon
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["player", "spread", "total", "winner"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setType(value);
                setSuppressResults(false);
                setPlayerQuery("");
                setSelectedPlayer(null);
                setTeamQuery("");
                setSelectedTeam(null);
                setProp("");
                setLine("");
                setDirection("over");
              }}
              className={`rounded-2xl border px-3 py-2 text-sm font-semibold capitalize transition ${
                type === value
                  ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-white/10 bg-white/5 text-gray-300"
              }`}
            >
              {value === "player" ? "Player Prop" : value === "winner" ? "ML" : value}
            </button>
          ))}
        </div>

        {type === "player" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlayerField
                label="Player"
                value={playerQuery}
                onChange={(val) => {
                  setSuppressResults(false);
                  setPlayerQuery(val);
                  setSelectedPlayer(null);
                }}
                results={playerResults}
            onSelect={(player) => {
              setPlayerQuery(player.name);
              setSelectedPlayer(player);
              setPlayerResults([]);
              setIsSearching(false);
              setSuppressResults(true);
              setOpenStat(true);
              requestAnimationFrame(() => {
                panelRef?.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                statRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              });
            }}
            isSearching={isSearching}
            liveLoading={liveLoading}
          />
        </div>

            <StatSelect
              label="Prop"
              value={prop}
              onChange={setProp}
              options={statOptions}
              shouldOpen={openStat}
              onOpened={() => setOpenStat(false)}
              innerRef={statRef}
            />
          </>
        )}

        {type !== "player" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamField
              label="Team"
              value={teamQuery}
              onChange={(val) => {
                setTeamQuery(val);
                setSelectedTeam(null);
              }}
              onSelect={(team) => {
                setTeamQuery(team.name);
                setSelectedTeam(team);
              }}
            />
            {type === "total" && (
              <DropdownSelect
                label="Market"
                value={totalMarket}
                onChange={setTotalMarket}
                options={[
                  "Game Total",
                  "Team Total",
                  "1st Half Total",
                  "2nd Half Total",
                ]}
              />
            )}
          </div>
        )}

        {type !== "winner" && (
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={type === "spread" ? "Spread line" : "Line"}
              value={line}
              onChange={setLine}
              placeholder={type === "spread" ? "-7" : "225.5"}
              inputMode="decimal"
              pattern="[-]?[0-9]*[.,]?[0-9]*"
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-200">
                Direction
              </p>
              <div className="flex gap-2">
                {["over", "under"].map((value) => (
                  <button
                key={value}
                type="button"
                onClick={() => setDirection(value)}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                      direction === value
                        ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-white/10 bg-white/5 text-gray-300"
                    }`}
                  >
                    {value === "over" ? "↗ Over" : "↘ Under"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-base font-semibold text-[#0b0b18] transition hover:opacity-90"
        >
          <Plus className="h-5 w-5" />
          Add to slip
        </button>
      </form>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  inputMode,
  pattern,
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white focus-within:border-[var(--accent-border)] focus-within:bg-[var(--accent-faint)]">
        {icon && icon}
        <input
          type={type}
          inputMode={inputMode}
          pattern={pattern}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
        />
      </div>
    </label>
  );
}

function PlayerField({
  label,
  value,
  onChange,
  results,
  onSelect,
  isSearching,
  liveLoading,
}) {
  const inputRef = useRef(null);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      <div className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white transition focus-within:border-[var(--accent-border)] focus-within:bg-[var(--accent-faint)] focus-within:ring-2 focus-within:ring-[var(--accent-border)]">
          <User className="h-4 w-4 text-gray-500" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search player..."
            className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
          {(isSearching || liveLoading) && (
            <span className="text-xs text-gray-400">Searching...</span>
          )}
        </div>

        {results.length > 0 && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--card-soft)] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <div className="max-h-72 overflow-y-auto">
            {results.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  onSelect(player);
                  // Delay to ensure mobile keyboards close reliably
                  setTimeout(() => inputRef.current?.blur?.(), 0);
                }}
                className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white hover:bg-white/5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                  <User className="h-4 w-4 text-[var(--accent-2)]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">{player.name}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
                    {player.team || "NFL"}
                  </span>
                </div>
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

function TeamField({ label, value, onChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const filtered =
    value.trim().length === 0
      ? nflTeams
      : nflTeams.filter(
          (team) =>
            team.name.toLowerCase().includes(value.toLowerCase()) ||
            team.abbr.toLowerCase().includes(value.toLowerCase())
        );

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      <div className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white transition focus-within:border-[var(--accent-border)] focus-within:bg-[var(--accent-faint)] focus-within:ring-2 focus-within:ring-[var(--accent-border)]">
          <User className="h-4 w-4 text-gray-500" />
          <input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            placeholder="Search team..."
            className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
          />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--card-soft)] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <div className="max-h-60 overflow-y-auto">
              {filtered.map((team) => (
                <button
                  key={team.abbr}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(team);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white hover:bg-white/5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                    <User className="h-4 w-4 text-[var(--accent-2)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{team.name}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
                      {team.abbr}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

function DropdownSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] focus:border-[var(--accent-border)]"
        >
          <span className={value ? "text-white" : "text-gray-500"}>
            {value || "Select..."}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        {open && (
          <div className="absolute z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[var(--card-soft)] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-white/5 ${
                  value === opt ? "text-[var(--accent-2)]" : "text-white"
                }`}
              >
                <span>{opt}</span>
                {value === opt && (
                  <TrendingUp className="h-4 w-4 text-[var(--accent-2)]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

function StatSelect({
  label,
  value,
  onChange,
  options,
  shouldOpen,
  onOpened,
  innerRef,
}) {
  const [open, setOpen] = useState(false);
  const selected = value || "";
  const triggerRef = useRef(null);

  useEffect(() => {
    if (selected) setOpen(false);
  }, [selected]);

  useEffect(() => {
    if (shouldOpen) {
      setOpen(true);
      onOpened?.();
    }
  }, [shouldOpen, onOpened]);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          onBlur={() => setOpen(false)}
          className="flex w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] focus:border-[var(--accent-border)]"
        >
          <span className={selected ? "text-white" : "text-gray-500"}>
            {selected || "Select prop..."}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {open && (
          <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[var(--card-soft)] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // ensure selection happens before blur
                  onChange(option);
                  setOpen(false);
                  triggerRef.current?.blur();
                  onOpened?.();
                }}
                className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-white/5 ${
                  selected === option ? "text-[var(--accent-2)]" : "text-white"
                }`}
              >
                <span>{option}</span>
                {selected === option && (
                  <TrendingUp className="h-4 w-4 text-[var(--accent-2)]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

function filterFallback(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return fallbackPlayers
    .filter((name) => name.toLowerCase().includes(q))
    .slice(0, 8)
    .map((name, idx) => ({
      id: `fallback-${idx}-${name}`,
      name,
      team: "NFL",
    }));
}

function filterRoster(list, query) {
  const q = query.trim().toLowerCase();
  if (!q || !list?.length) return [];
  const matches = list.filter((player) => {
    const name = player?.name?.toLowerCase() || "";
    const team = player?.team?.toLowerCase() || "";
    return name.includes(q) || team.includes(q);
  });
  // de-dupe on name + team
  const seen = new Set();
  return matches.filter((p) => {
    const key = `${p.name}-${p.team}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeRoster(list) {
  const seen = new Set();
  return list.filter((p) => {
    const key = `${p.name}-${p.team}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractPlayersFromSummary(summary) {
  const out = [];
  const teams = summary?.boxscore?.players || [];
  teams.forEach((teamBlock) => {
    const teamAbbr =
      teamBlock?.team?.abbreviation ||
      teamBlock?.team?.shortDisplayName ||
      teamBlock?.team?.name ||
      "";
    const stats = teamBlock?.statistics || [];
    stats.forEach((statGroup) => {
      (statGroup?.athletes || []).forEach((ath) => {
        const athlete = ath?.athlete;
        if (!athlete?.displayName) return;
        out.push({
          id: athlete.id || athlete.uid || athlete.guid || athlete.displayName,
          name: athlete.displayName,
          team: teamAbbr || "NFL",
        });
      });
    });
  });
  return out;
}

async function fetchScoreboard() {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
  );
  if (!res.ok) throw new Error("scoreboard fetch failed");
  const data = await res.json();
  return data.events || [];
}

function mapEventsByTeam(events) {
  const map = {};
  events.forEach((event) => {
    const id = event.id;
    const comps = event?.competitions?.[0]?.competitors || [];
    comps.forEach((comp) => {
      const abbr = comp?.team?.abbreviation;
      if (abbr) {
        map[abbr.toUpperCase()] = { id, status: event?.status };
      }
    });
  });
  return map;
}

async function fetchSummaries(eventIds) {
  const results = await Promise.all(
    eventIds.map(async (eventId) => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`
      );
      if (!res.ok) throw new Error("summary fetch failed");
      const summary = await res.json();
      return { eventId, summary };
    })
  );
  return results;
}

function getPlayerStatValue(summary, playerId, playerName, statType) {
  if (!summary) return null;
  const players = summary?.boxscore?.players || [];

  const targetCategory = mapStatTypeToGroup(statType);
  let foundStats = null;

  players.forEach((team) => {
    team?.statistics
      ?.filter((statGroup) => {
        const cat = (statGroup?.type || statGroup?.name || "").toLowerCase();
        return targetCategory ? cat.includes(targetCategory) : true;
      })
      ?.forEach((statGroup) => {
        const labels = statGroup?.labels || [];
        (statGroup?.athletes || []).forEach((ath) => {
          const athId = ath?.athlete?.id;
          const name = ath?.athlete?.displayName || ath?.athlete?.shortName;
          const matchById = playerId && athId && `${athId}` === `${playerId}`;
          const matchByName =
            playerName &&
            name &&
            name.toLowerCase() === playerName.toLowerCase();
          if (!matchById && !matchByName) return;

          const stats = ath?.stats || [];
          const mapped = {};
          labels.forEach((label, idx) => {
            const raw = stats[idx];
            const lower = label.toLowerCase();
            if (lower.includes("cmp/att")) {
              const [cmp, att] = (raw || "").split("/").map((n) => Number(n));
              mapped.cmp = isNaN(cmp) ? 0 : cmp;
              mapped.att = isNaN(att) ? 0 : att;
            } else if (lower.includes("fgm")) {
              const first = Number((raw || "").split("-")[0]);
              mapped.fgm = isNaN(first) ? 0 : first;
            } else if (lower.includes("xp")) {
              const first = Number((raw || "").split("-")[0]);
              mapped.xpm = isNaN(first) ? 0 : first;
            } else if (lower.includes("yds")) {
              const num = Number(raw);
              mapped.yds = isNaN(num) ? 0 : num;
            } else if (lower.includes("td")) {
              const num = Number(raw);
              mapped.td = isNaN(num) ? 0 : num;
            } else if (lower.includes("int")) {
              const num = Number(raw);
              mapped.int = isNaN(num) ? 0 : num;
            } else if (lower.includes("att")) {
              const num = Number(raw);
              mapped.att = isNaN(num) ? 0 : num;
            } else if (lower.includes("rec")) {
              const num = Number(raw);
              mapped.rec = isNaN(num) ? 0 : num;
            } else if (lower.includes("tar")) {
              const num = Number(raw);
              mapped.tar = isNaN(num) ? 0 : num;
            } else if (lower.includes("lng")) {
              const num = Number(raw);
              mapped.lng = isNaN(num) ? 0 : num;
            } else if (lower.includes("tot")) {
              const num = Number(raw);
              mapped.tot = isNaN(num) ? 0 : num;
            }
          });

          foundStats = {
            category: statGroup?.type?.toLowerCase?.() || "",
            values: mapped,
          };
        });
      });
  });

  if (!foundStats) return null;
  const v = foundStats.values;
  const st = (statType || "").toLowerCase();

  if (st.includes("passing yards")) return v.yds ?? null;
  if (st.includes("passing tds")) return v.td ?? null;
  if (st.includes("interceptions")) return v.int ?? null;
  if (st.includes("completions")) return v.cmp ?? null;
  if (st.includes("passing attempts")) return v.att ?? null;
  if (st.includes("rushing yards")) return v.yds ?? null;
  if (st.includes("rushing tds")) return v.td ?? null;
  if (st.includes("rushing attempts") || st.includes("carries"))
    return v.att ?? null;
  if (st.includes("receiving yards")) return v.yds ?? null;
  if (st.includes("receiving tds")) return v.td ?? null;
  if (st.includes("receptions")) return v.rec ?? null;
  if (st.includes("targets")) return v.tar ?? null;
  if (st.includes("longest pass")) return v.lng ?? null;
  if (st.includes("longest rush")) return v.lng ?? null;
  if (st.includes("longest reception")) return v.lng ?? null;
  if (st.includes("sacks recorded")) return v.tot ?? null;
  if (st.includes("tackles") || st.includes("assists")) return v.tot ?? null;
  if (st.includes("field goals")) return v.fgm ?? null;
  if (st.includes("extra points")) return v.xpm ?? null;

  return null;
}

function mapStatTypeToGroup(statType) {
  const st = (statType || "").toLowerCase();
  if (st.includes("pass")) return "passing";
  if (st.includes("rush")) return "rushing";
  if (st.includes("rec")) return "receiving";
  if (st.includes("tackle") || st.includes("sack")) return "defense";
  if (st.includes("field goal") || st.includes("extra point")) return "kicking";
  return "";
}
