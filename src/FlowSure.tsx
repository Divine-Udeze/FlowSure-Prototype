import { useState, useMemo } from "react";
import {
  Droplets,
  MapPin,
  Bell,
  Home,
  Clock,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Check,
  Plus,
  ShieldCheck,
  Camera,
  Settings as SettingsIcon,
  Trash2,
  Info,
  Route,
  Users,
  Landmark,
  History,
  RefreshCw,
  Type,
  Contrast,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { color, level, space, radius, typography } from "./theme";
import { Button, Card, IconTile, LevelPill, Meter, Notice, Pill, SeverityTile, WaveStrip } from "./components/ui";

// ---- demo data anchored to the Garissa / Tana River case study ----
const DEMO_LOCATIONS = [
  {
    id: "h1",
    name: "Riverside Ward, near the bridge",
    tier: "near",
    tierLabel: "Right by the river",
    distanceM: 20,
    trigger: 5.0,
    coords: "-0.4569, 39.6583",
    color: level.act.fill,
    history: [2018, 2020, 2024],
    shelter: { name: "Garissa Primary grounds", distanceKm: 1.1 },
    upstream: [
      { label: "53 km upstream", hoursAway: 26 },
      { label: "28 km upstream", hoursAway: 11 },
    ],
  },
  {
    id: "h2",
    name: "Bula, past the market road",
    tier: "mid",
    tierLabel: "A short walk from the river",
    distanceM: 70,
    trigger: 5.65,
    coords: "-0.4498, 39.6641",
    color: level.watch.fill,
    history: [2020],
    shelter: { name: "Bula Chief's camp", distanceKm: 0.6 },
    upstream: [
      { label: "60 km upstream", hoursAway: 30 },
      { label: "31 km upstream", hoursAway: 14 },
    ],
  },
  {
    id: "h3",
    name: "Iftin, near the Garissa–Daadab road",
    tier: "far",
    tierLabel: "Well back from the river",
    distanceM: 165,
    trigger: 6.3,
    coords: "-0.4612, 39.6497",
    color: level.quiet.fill,
    history: [],
    shelter: { name: "Iftin market hall", distanceKm: 1.8 },
    upstream: [
      { label: "70 km upstream", hoursAway: 34 },
      { label: "35 km upstream", hoursAway: 17 },
    ],
  },
];

const STAGE_HISTORY = [
  { day: "Mon", stage: 4.1 },
  { day: "Tue", stage: 4.2 },
  { day: "Wed", stage: 4.35 },
  { day: "Thu", stage: 4.5 },
  { day: "Fri", stage: 4.6 },
  { day: "Sat", stage: 4.7 },
  { day: "Today", stage: 4.8 },
];

const STAGE_HISTORY_30D = [
  { day: "Aug 1", stage: 3.9 },
  { day: "Aug 5", stage: 3.95 },
  { day: "Aug 9", stage: 4.0 },
  { day: "Aug 13", stage: 4.05 },
  { day: "Aug 17", stage: 4.15 },
  { day: "Aug 21", stage: 4.3 },
  { day: "Aug 25", stage: 4.45 },
  { day: "Aug 29", stage: 4.6 },
  { day: "Today", stage: 4.8 },
];

// next-14-day chance of a season-defining flood, per day (illustrative ensemble spread)
const OUTLOOK_14D = [3, 4, 6, 9, 14, 19, 24, 21, 17, 12, 9, 6, 4, 3];

const CHECKPOINTS = [
  {
    id: "cp1",
    title: "Rain fell in the hills that feed this river",
    kind: "early",
    action: "Nothing to do yet — we're just keeping watch for you.",
  },
  {
    id: "cp2",
    title: "The river is rising and moving toward town",
    kind: "early",
    action: "Good time to think about what you'd move first.",
  },
  {
    id: "cp3",
    title: "Water has reached the channel near you",
    kind: "early",
    action: "Move animals and anything valuable to higher ground now.",
  },
  {
    id: "cp4",
    title: "Water has reached your home",
    detail: "This is the one that pays out.",
    kind: "trigger",
    action: "Get to safety. Your payout has been started — we'll confirm the moment it lands.",
  },
];

const REPORT_OPTIONS = [
  { id: "clear", label: "All clear here", icon: Check, tone: level.quiet.fill },
  { id: "road", label: "Water on the road", icon: Route, tone: level.watch.fill },
  { id: "compound", label: "Water in my compound", icon: Home, tone: level.watch.fill },
  { id: "house", label: "Water in my house", icon: Landmark, tone: level.act.fill },
];

function statusForLocation(loc, currentStage) {
  const gap = loc.trigger - currentStage;
  if (gap <= 0) return { key: "act" as const, label: "Breached — payout processing", ...level.act };
  if (gap <= 0.5) return { key: "watch" as const, label: "Watch closely", ...level.watch };
  return { key: "quiet" as const, label: "Quiet for now", ...level.quiet };
}

// preview-only overrides so every state can be demoed without waiting for a real flood
const PREVIEW_STATES = {
  auto: null,
  safe: { key: "quiet", label: "Quiet for now", ...level.quiet, gap: 1.2 },
  watch: { key: "watch", label: "Watch closely", ...level.watch, gap: 0.3 },
  breached: { key: "act", label: "Breached — payout processing", ...level.act, gap: -0.05 },
  paid: { key: "done", label: "Payout sent", ...level.done, gap: -0.05 },
};

function effectiveState(loc, currentStage, previewMode) {
  const override = PREVIEW_STATES[previewMode];
  if (!override) {
    const gap = loc.trigger - currentStage;
    return { status: statusForLocation(loc, currentStage), gap, paid: false };
  }
  const { gap, ...status } = override;
  return { status, gap, paid: previewMode === "paid" };
}

function progressIndexFor(statusKey) {
  if (statusKey === "act" || statusKey === "done") return 4;
  if (statusKey === "watch") return 2;
  return 1;
}

function timeToImpact(gap, loc, statusKey) {
  if (statusKey === "done") return "Payout already sent";
  if (gap <= 0) return "Water has already reached this address";
  const nearestCell = loc.upstream[loc.upstream.length - 1];
  if (gap < 0.3) return `~${nearestCell.hoursAway}h, if rain keeps up`;
  if (gap < 0.8) return "A day or two out";
  return "Several days out";
}

function freshness(lastCheckedAt) {
  const mins = Math.round((Date.now() - lastCheckedAt) / 60000);
  let text;
  if (mins < 60) text = `Checked ${mins} min ago`;
  else if (mins < 60 * 24) text = `Checked ${Math.round(mins / 60)}h ago`;
  else text = `Checked ${Math.round(mins / (60 * 24))}d ago`;
  const state = mins < 120 ? "fresh" : mins < 720 ? "aging" : "stale";
  const textColor = state === "fresh" ? color.success : state === "aging" ? color.warning : color.error;
  return { text, state, textColor };
}

export default function FlowSure() {
  const [view, setView] = useState("onboarding");
  const [pendingLoc, setPendingLoc] = useState(null);
  const [savedLocs, setSavedLocs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState("home");
  const [manualQuery, setManualQuery] = useState("");
  const [showDemoList, setShowDemoList] = useState(false);
  const [reportSent, setReportSent] = useState(null);
  const [previewMode, setPreviewMode] = useState("auto");
  const [textScale, setTextScale] = useState("normal"); // 'normal' | 'large'
  const [highContrast, setHighContrast] = useState(false);
  const [sharedContacts, setSharedContacts] = useState({}); // { [locId]: string[] }
  const [lastCheckedAt] = useState(() => Date.now() - 34 * 60 * 1000);

  const currentStage = 4.8;

  const active = useMemo(
    () => savedLocs.find((l) => l.id === activeId) || savedLocs[0],
    [savedLocs, activeId]
  );

  function chooseDemo(loc) {
    setPendingLoc(loc);
    setView("confirm");
  }

  function confirmLocation() {
    if (!savedLocs.find((l) => l.id === pendingLoc.id)) {
      setSavedLocs((s) => [...s, pendingLoc]);
    }
    setActiveId(pendingLoc.id);
    setView("app");
    setTab("home");
  }

  // ---------------- ONBOARDING ----------------
  if (view === "onboarding") {
    return (
      <Shell textScale={textScale} highContrast={highContrast}>
        <div style={{ padding: "44px 24px 20px" }}>
          <Brand />
          <h1 style={{ ...typography.display, color: color.white, margin: "16px 0 10px" }}>
            Know before the river gets to you.
          </h1>
          <p style={{ ...typography.body, color: color.white, margin: "0 0 22px" }}>
            One place. Watched daily. We'll tell you if it's coming, and roughly when — not
            just how many millimetres fell somewhere upstream.
          </p>

          <div style={{ display: "flex", gap: 18, marginBottom: 4 }}>
            <IconTile icon={MapPin} title="One place" caption="Home, shop or farm" tint="teal" />
            <IconTile icon={Clock} title="Checked daily" caption="Rain and river" tint="teal" />
            <IconTile icon={Camera} title="You report" caption="One tap" tint="teal" />
          </div>
        </div>

        <div
          className="uf-scroll"
          style={{
            background: color.page,
            borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`,
            flex: 1,
            padding: "26px 24px 32px",
            overflowY: "auto",
          }}
        >
          <Button variant="primary" icon={Navigation} onClick={() => chooseDemo(DEMO_LOCATIONS[0])}>
            Set my location
          </Button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 12, background: color.surfaceMuted, borderRadius: radius.dot }} />
            <span style={{ ...typography.small, color: color.textSecondary }}>or type your area</span>
            <div style={{ flex: 1, height: 12, background: color.surfaceMuted, borderRadius: radius.dot }} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: color.surface,
              borderRadius: radius.input,
              padding: "12px 14px",
              marginBottom: 18,
            }}
          >
            <MapPin size={17} color={color.textSecondary} />
            <input
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="e.g. Bula, Iftin, Ahero market..."
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                ...typography.body,
                color: color.text,
                background: "transparent",
              }}
            />
          </div>

          <button
            onClick={() => setShowDemoList((s) => !s)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              padding: "6px 2px",
              color: color.tealDark,
              ...typography.smallMedium,
              cursor: "pointer",
              marginBottom: showDemoList ? 10 : 4,
            }}
          >
            Try a demo place
            <ChevronRight
              size={14}
              style={{ transform: showDemoList ? "rotate(90deg)" : "none", transition: "transform .15s" }}
            />
          </button>

          {showDemoList && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {DEMO_LOCATIONS.map((loc) => (
                <button key={loc.id} onClick={() => chooseDemo(loc)} style={demoRow}>
                  <div style={{ width: 8, height: 8, borderRadius: radius.dot, background: loc.color, flexShrink: 0 }} />
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ ...typography.bodyMedium, color: color.text }}>{loc.name}</div>
                    <div style={{ ...typography.small, color: color.textSecondary }}>{loc.tierLabel}</div>
                  </div>
                  <ChevronRight size={16} color={color.textSecondary} />
                </button>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ ...typography.overline, color: color.textTertiary, marginBottom: 6 }}>Covered so far</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Kisumu", "Mombasa", "Nairobi", "Tana River — 4 sites"].map((c) => (
                <Pill key={c} tone="teal">{c}</Pill>
              ))}
            </div>
          </div>

          <p style={{ ...typography.small, color: color.textSecondary, lineHeight: 1.5, marginBottom: 4 }}>
            We store your place — and your number, only if you add it — to send you watch
            updates. Delete either any time from Settings.
          </p>
          <p style={{ ...typography.small, color: color.textTertiary, lineHeight: 1.5 }}>
            Not an official government warning service. Always follow local authorities during
            an emergency.
          </p>
        </div>
      </Shell>
    );
  }

  // ---------------- CONFIRM ----------------
  if (view === "confirm") {
    const loc = pendingLoc;
    return (
      <Shell textScale={textScale} highContrast={highContrast}>
        <div style={{ padding: "20px 20px 0" }}>
          <button
            onClick={() => setView("onboarding")}
            style={{ width: 34, height: 34, borderRadius: radius.dot, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 18 }}
          >
            <ChevronLeft size={18} color={color.white} />
          </button>
        </div>
        <div style={{ padding: "0 24px" }}>
          <h2 style={{ ...typography.pageTitle, color: color.white, margin: "6px 0 6px" }}>
            Is this your place?
          </h2>
          <p style={{ ...typography.body, color: color.white, marginBottom: 18 }}>
            GPS can drift a little. Nudge the pin if it's not quite right — it changes how much
            notice we can give you.
          </p>
        </div>

        {/* Map preview — out of scope for this pass, left as-is */}
        <div
          style={{
            margin: "0 20px",
            borderRadius: radius.card,
            overflow: "hidden",
            background: "linear-gradient(160deg, #1E5FA8 0%, #0D3D85 100%)",
            height: 150,
            position: "relative",
          }}
        >
          <MapDecor />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: color.white,
                border: `4px solid ${loc.color}`,
                boxShadow: "0 0 0 6px rgba(238,243,241,0.25)",
              }}
            />
          </div>
        </div>

        <div style={{ background: color.page, borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`, flex: 1, marginTop: 18, padding: "22px 24px 32px" }}>
          <Card>
            <div style={{ ...typography.bodyMedium, color: color.text, marginBottom: 4 }}>{loc.name}</div>
            <div style={{ ...typography.small, color: color.textSecondary }}>{loc.tierLabel}</div>
          </Card>
          <Button variant="primary" icon={Check} onClick={confirmLocation}>
            Yes, watch this place
          </Button>
          <div style={{ marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setView("onboarding")}>
              Try a different pin
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------------- MAIN APP ----------------
  if (!active) return null;
  const { status, gap, paid } = effectiveState(active, currentStage, previewMode);
  const progressIndex = progressIndexFor(status.key);

  return (
    <Shell textScale={textScale} highContrast={highContrast}>
      <TopBar loc={active} status={status} gap={gap} activeLoc={active} lastCheckedAt={lastCheckedAt} />

      <div
        className="uf-scroll"
        style={{
          background: color.page,
          borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`,
          flex: 1,
          marginTop: -14,
          padding: "24px 20px 90px",
          overflowY: "auto",
        }}
      >
        {tab === "home" && (
          <HomeTab
            loc={active}
            gap={gap}
            onSeePath={() => setTab("path")}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
          />
        )}
        {tab === "path" && <PathTab loc={active} progressIndex={progressIndex} paid={paid} />}
        {tab === "alerts" && <AlertsTab loc={active} progressIndex={progressIndex} paid={paid} />}
        {tab === "report" && (
          <ReportTab loc={active} reportSent={reportSent} onSend={(id) => setReportSent(id)} />
        )}
        {tab === "more" && (
          <MoreTab
            savedLocs={savedLocs}
            activeId={active.id}
            onSelect={(id) => {
              setActiveId(id);
              setTab("home");
            }}
            onAdd={() => setView("onboarding")}
            currentStage={currentStage}
            activePaid={paid}
            activeStatus={status}
            sharedContacts={sharedContacts}
            setSharedContacts={setSharedContacts}
            textScale={textScale}
            setTextScale={setTextScale}
            highContrast={highContrast}
            setHighContrast={setHighContrast}
          />
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} />
    </Shell>
  );
}

// ================= subcomponents =================

function Shell({ children, textScale, highContrast }) {
  return (
    <div
      className={highContrast ? "uf-hc" : undefined}
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        minHeight: 720,
        background: color.brandDark,
        display: "flex",
        flexDirection: "column",
        borderRadius: 32,
        overflow: "hidden",
        boxShadow: "0 30px 60px rgba(6,28,29,0.35)",
        position: "relative",
        zoom: textScale === "large" ? 1.16 : 1,
      }}
    >
      {children}
    </div>
  );
}

function LogoMark({ size = 19, color: fill = color.teal }) {
  return (
    <svg
      width={size}
      height={(size * 1024) / 1536}
      viewBox="0 0 1536 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M 700 402 L 134 73 L 121 73 L 118 150 L 185 212 L 226 271 L 256 346 L 265 440 L 252 508 L 221 574 L 167 638 L 102 688 L 102 758 L 114 762 L 694 415 Z M 1452 26 L 637 530 L 645 542 L 1443 1000 L 1456 990 L 1455 902 L 1363 834 L 1281 735 L 1233 618 L 1224 504 L 1239 417 L 1289 306 L 1361 211 L 1461 122 L 1461 34 Z"
        fill={fill}
      />
    </svg>
  );
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: color.teal }}>
      <LogoMark size={19} color={color.teal} />
      <span style={{ ...typography.overline, color: color.teal }}>
        FlowSure
      </span>
    </div>
  );
}

function MapDecor() {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <path d="M -20 40 C 60 70, 100 20, 180 55 S 300 90, 420 50" stroke="#6FA8E0" strokeWidth="26" fill="none" opacity="0.35" />
      <path d="M -20 40 C 60 70, 100 20, 180 55 S 300 90, 420 50" stroke="#A9D4F5" strokeWidth="10" fill="none" opacity="0.5" />
    </svg>
  );
}

function TopBar({ loc, status, gap, activeLoc, lastCheckedAt }) {
  const fresh = freshness(lastCheckedAt);
  return (
    <div style={{ padding: "20px 20px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <Brand />
        <Pill tone="teal">
          <MapPin size={13} color={color.tealDeep} />
          {loc.name.split(",")[0]}
        </Pill>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: radius.dot,
            background: status.fill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Check size={18} color={status.text} />
        </div>
        <div>
          <p style={{ ...typography.pageTitle, color: color.white, margin: 0 }}>{status.label}</p>
          <p style={{ ...typography.small, color: color.white, margin: "2px 0 0" }}>
            {timeToImpact(gap, activeLoc, status.key)}
          </p>
        </div>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <RefreshCw size={11} color={fresh.textColor} />
        <span style={{ ...typography.small, color: color.teal }}>{fresh.text}</span>
        {fresh.state === "stale" && (
          <span style={{ ...typography.smallMedium, color: color.warning }}>· data may be delayed</span>
        )}
      </div>

      {(status.key === "watch" || status.key === "act") && loc.shelter && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <Landmark size={16} color={color.white} style={{ flexShrink: 0 }} />
          <div style={{ ...typography.small, color: color.white, lineHeight: 1.3 }}>
            Nearest higher ground: <strong>{loc.shelter.name}</strong> · {loc.shelter.distanceKm} km away
          </div>
        </div>
      )}
    </div>
  );
}

function Outlook14Day() {
  const max = Math.max(...OUTLOOK_14D);
  return (
    <Card overline="Next 14 days">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <span style={{ ...typography.small, color: color.textSecondary }}>chance of a big flood, per day</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
        {OUTLOOK_14D.map((v, i) => (
          <div
            key={i}
            title={`${v}%`}
            style={{
              flex: 1,
              height: `${Math.max(6, (v / max) * 100)}%`,
              background: v >= 18 ? color.error : v >= 8 ? color.warning : color.teal,
              borderRadius: 3,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ ...typography.chartLabel, color: color.textTertiary }}>Today</span>
        <span style={{ ...typography.chartLabel, color: color.textTertiary }}>+14 days</span>
      </div>
      <div style={{ ...typography.small, color: color.textSecondary, marginTop: 8, lineHeight: 1.4 }}>
        Peaks around day 7 — based on 50 weather-model runs. Still a forecast, not a certainty.
      </div>
    </Card>
  );
}

function PreviewSwitcher({ previewMode, setPreviewMode }) {
  const modes = [
    { key: "auto", label: "Live" },
    { key: "safe", label: "Safe" },
    { key: "watch", label: "Watch" },
    { key: "breached", label: "Breach" },
    { key: "paid", label: "Paid" },
  ];
  return (
    <div style={{ marginBottom: space[6] }}>
      <div style={{ ...typography.overline, color: color.textTertiary, marginBottom: 6 }}>
        Preview a state (for this demo only)
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setPreviewMode(m.key)}
            style={{
              flex: 1,
              padding: "7px 0",
              ...typography.smallMedium,
              borderRadius: radius.button,
              cursor: "pointer",
              border: "none",
              background: previewMode === m.key ? color.tealDark : color.surfaceMuted,
              color: previewMode === m.key ? color.white : color.textSecondary,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryCard({ loc }) {
  const has = loc.history && loc.history.length > 0;
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <History size={15} color={color.tealDark} />
        <div style={{ ...typography.small, color: color.textSecondary }}>Has this happened before?</div>
      </div>
      {has ? (
        <div style={{ ...typography.bodyMedium, color: color.text }}>
          This spot has flooded in {loc.history.join(", ")}.
        </div>
      ) : (
        <div style={{ ...typography.bodyMedium, color: color.text }}>
          No recorded floods here yet — but that can change as the model learns more.
        </div>
      )}
    </Card>
  );
}

function HomeTab({ loc, gap, onSeePath, previewMode, setPreviewMode }) {
  const [range, setRange] = useState("7d");
  const data = range === "7d" ? STAGE_HISTORY : STAGE_HISTORY_30D;
  // gap is always (trigger - stage), so this stays correct whether we're in
  // the live reading or a previewed state
  const displayStage = loc.trigger - gap;

  return (
    <div>
      <PreviewSwitcher previewMode={previewMode} setPreviewMode={setPreviewMode} />

      <Card overline="Right now, at your place">
        <Meter icon={Home} label="River level vs. the level that reaches your home" value={displayStage} max={loc.trigger} unit="m" />
        <div style={{ ...typography.small, color: color.textSecondary, marginTop: 10, lineHeight: 1.4 }}>
          Your home sits {loc.trigger > 5.6 ? "well back from" : loc.trigger > 5.1 ? "a short walk from" : "right by"} the
          river — that's why the bar fills where it does.
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ ...typography.small, color: color.textSecondary }}>River level trend</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["7d", "30d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  ...typography.small,
                  padding: "4px 9px",
                  borderRadius: radius.pill,
                  cursor: "pointer",
                  border: "none",
                  background: range === r ? color.tealDark : color.surfaceMuted,
                  color: range === r ? color.white : color.textSecondary,
                }}
              >
                {r === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 96 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: color.textSecondary }} axisLine={false} tickLine={false} interval={range === "30d" ? 1 : 0} />
              <YAxis hide domain={[3.8, 6.6]} />
              <ReferenceLine y={loc.trigger} stroke={color.error} strokeDasharray="4 3" strokeWidth={1.5} />
              <Tooltip formatter={(v) => [`${v} m`, "River level"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="stage" stroke={color.teal} strokeWidth={2} fill={color.tealSurface} fillOpacity={0.9} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...typography.small, color: color.textSecondary, marginTop: 4 }}>
          Dashed line marks the level that would reach your home.
        </div>
      </Card>

      <Outlook14Day />

      <HistoryCard loc={loc} />

      <Button variant="secondary" icon={Route} onClick={onSeePath}>
        See the water's path to you
      </Button>
    </div>
  );
}

function PathTab({ loc, progressIndex, paid }) {
  const nextCp = CHECKPOINTS[Math.min(progressIndex, CHECKPOINTS.length - 1)];
  const atFinal = progressIndex >= CHECKPOINTS.length;
  const progressPct = (Math.min(progressIndex, 4) / 4) * 100;

  const waveNodes = [
    ...loc.upstream.map((u) => ({ label: u.label, sub: `~${u.hoursAway}h to you`, tone: "teal" as const })),
    { label: "Your place", sub: "you are here", tone: "text" as const, you: true },
  ];

  return (
    <div>
      <h3 style={{ ...typography.sectionTitle, color: color.text, margin: "2px 0 4px" }}>
        The water's path to you
      </h3>
      <p style={{ ...typography.small, color: color.textSecondary, marginBottom: 16 }}>
        From the hills where it starts, to your door. Only the last step means a payout — the
        rest are just so you're never caught off guard.
      </p>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ ...typography.small, color: color.textSecondary }}>Progress along the path</span>
          <span style={{ ...typography.smallMedium, color: color.tealDark }}>
            {atFinal ? "Reached" : `Step ${progressIndex} of 4`}
          </span>
        </div>
        <div style={{ position: "relative", height: 8, background: color.surfaceMuted, borderRadius: radius.dot }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progressPct}%`,
              borderRadius: radius.dot,
              background: atFinal ? (paid ? level.done.fill : level.act.fill) : color.tealDark,
              transition: "width 0.5s ease",
            }}
          />
          <Droplets
            size={14}
            color={atFinal ? (paid ? level.done.fill : level.act.fill) : color.tealDark}
            style={{ position: "absolute", top: -4, left: `calc(${progressPct}% - 7px)`, transition: "left 0.5s ease" }}
          />
        </div>
        {!atFinal && (
          <div style={{ ...typography.small, color: color.textSecondary, marginTop: 8 }}>
            Next: <strong style={{ color: color.text }}>{nextCp.title}</strong> — a modeled estimate,
            not a guarantee.
          </div>
        )}
      </Card>

      <div style={{ marginBottom: 20 }}>
        <WaveStrip nodes={waveNodes} />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {CHECKPOINTS.map((cp, i) => {
          const stepNum = i + 1;
          const passed = stepNum <= progressIndex;
          const isCurrent = stepNum === progressIndex && !(paid && stepNum === 4);
          const isPaidFinal = paid && stepNum === 4;
          return (
            <div key={cp.id} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: radius.dot,
                    background: isPaidFinal ? level.done.fill : passed ? (cp.kind === "trigger" ? level.act.fill : color.tealDark) : color.surfaceMuted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {passed ? <Check size={15} color={color.white} /> : <span style={{ ...typography.small, color: color.textSecondary }}>{stepNum}</span>}
                </div>
                {i < CHECKPOINTS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 32, background: stepNum < progressIndex ? color.tealDark : color.surfaceMuted }} />
                )}
              </div>
              <div style={{ paddingBottom: 22 }}>
                <div
                  style={{
                    ...typography.overline,
                    color: cp.kind === "trigger" ? (isPaidFinal ? level.done.fill : level.act.fill) : color.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  {cp.kind === "trigger" ? (isPaidFinal ? "Payout sent" : "Insurance trigger") : "Early watch"}
                </div>
                <div style={{ ...typography.bodyMedium, color: color.text }}>{cp.title}</div>
                {cp.detail && <div style={{ ...typography.small, color: color.textSecondary, marginTop: 2 }}>{cp.detail}</div>}
                {passed && cp.action && (
                  <div style={{ ...typography.small, color: color.textSecondary, marginTop: 4 }}>{cp.action}</div>
                )}
                {isCurrent && (
                  <div style={{ marginTop: 8 }}>
                    <Pill tone="teal">We're here now</Pill>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertsTab({ loc, progressIndex, paid }) {
  // build a staged feed: each checkpoint reached becomes a timestamped alert,
  // most recent first — this is what section 7.5 calls the "staged notification feed"
  const now = Date.now();
  const passedCheckpoints = CHECKPOINTS.slice(0, progressIndex);
  const feed = passedCheckpoints
    .map((cp, i) => {
      const hoursAgo = (passedCheckpoints.length - 1 - i) * 7 + 1;
      const isFinal = i === CHECKPOINTS.length - 1;
      return {
        ...cp,
        time: new Date(now - hoursAgo * 3600 * 1000),
        title: isFinal && paid ? "Payout sent" : cp.title,
      };
    })
    .reverse();

  return (
    <div>
      <h3 style={{ ...typography.sectionTitle, color: color.text, margin: "2px 0 4px" }}>Updates</h3>
      <p style={{ ...typography.small, color: color.textSecondary, marginBottom: 16 }}>
        Every step the water takes toward {loc.name.split(",")[0]}, in order — with what to do
        about it.
      </p>

      {feed.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ ...typography.body, color: color.textSecondary }}>
            No updates yet — we're quietly watching this place for you.
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {feed.map((a, i) => {
          const isTrigger = a.kind === "trigger";
          const isPaidEvent = isTrigger && paid;
          return (
            <Card key={i} style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span
                  style={{
                    ...typography.overline,
                    color: isTrigger ? (isPaidEvent ? level.done.fill : level.act.fill) : color.tealDark,
                  }}
                >
                  {isTrigger ? (isPaidEvent ? "Payout" : "Insurance trigger") : "Early watch"}
                </span>
                <span style={{ ...typography.small, color: color.textSecondary }}>
                  {a.time.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {", "}
                  {a.time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ ...typography.bodyMedium, color: color.text, marginBottom: 4 }}>{a.title}</div>
              <div style={{ ...typography.small, color: color.textSecondary, lineHeight: 1.4 }}>{a.action}</div>
            </Card>
          );
        })}
      </div>

      <Card style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
        <Bell size={17} color={color.tealDark} />
        <div style={{ ...typography.small, color: color.textSecondary }}>
          You'll also get these by SMS, in case the network is slow.
        </div>
      </Card>
    </div>
  );
}

function NearbyReports({ loc }) {
  const byTier = {
    near: [
      { who: "Neighbour, Riverside Ward", what: "Water on the road near the bridge", when: "18 min ago" },
      { who: "Neighbour, Riverside Ward", what: "All clear at the market", when: "1h ago" },
    ],
    mid: [
      { who: "Neighbour, Bula", what: "All clear here", when: "40 min ago" },
    ],
    far: [
      { who: "Neighbour, Iftin", what: "All clear here", when: "2h ago" },
    ],
  };
  const reports = byTier[loc.tier] || [];
  if (reports.length === 0) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ ...typography.overline, color: color.textTertiary, marginBottom: 10 }}>
        What neighbours are seeing
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {reports.map((r, i) => (
          <Card key={i} tint="alt" style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 0 }}>
            <Users size={15} color={color.tealDark} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...typography.smallMedium, color: color.text }}>{r.what}</div>
              <div style={{ ...typography.small, color: color.textSecondary, marginTop: 1 }}>{r.who} · {r.when}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportTab({ loc, reportSent, onSend }) {
  return (
    <div>
      <h3 style={{ ...typography.sectionTitle, color: color.text, margin: "2px 0 4px" }}>
        What are you seeing?
      </h3>
      <p style={{ ...typography.small, color: color.textSecondary, marginBottom: 18 }}>
        One tap. Your reports help us warn the next person faster — and help us get the model
        right.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {REPORT_OPTIONS.map((opt) => (
          <SeverityTile key={opt.id} icon={opt.icon} label={opt.label} selected={reportSent === opt.id} onClick={() => onSend(opt.id)} />
        ))}
      </div>

      {reportSent && (
        <Notice tone="neutral">
          Thanks — sent for {loc.name.split(",")[0]} just now. Neighbours nearby will see this
          reflected in their watch too.
        </Notice>
      )}

      <div style={{ marginTop: reportSent ? 18 : 0 }}>
        <Button variant="secondary" icon={Camera}>
          Add a photo (optional)
        </Button>
      </div>

      <NearbyReports loc={loc} />
    </div>
  );
}

function MoreTab({
  savedLocs,
  activeId,
  onSelect,
  onAdd,
  currentStage,
  activePaid,
  activeStatus,
  sharedContacts,
  setSharedContacts,
  textScale,
  setTextScale,
  highContrast,
  setHighContrast,
}) {
  const [pushOn, setPushOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);
  const [multiVote, setMultiVote] = useState(null);
  const [lang, setLang] = useState("en");
  const [newContact, setNewContact] = useState("");
  const activeLoc = savedLocs.find((l) => l.id === activeId) || savedLocs[0];
  const contactsForActive = (activeLoc && sharedContacts[activeLoc.id]) || [];

  function addContact() {
    if (!newContact.trim() || !activeLoc) return;
    setSharedContacts((prev) => ({
      ...prev,
      [activeLoc.id]: [...(prev[activeLoc.id] || []), newContact.trim()],
    }));
    setNewContact("");
  }

  function removeContact(idx) {
    if (!activeLoc) return;
    setSharedContacts((prev) => ({
      ...prev,
      [activeLoc.id]: prev[activeLoc.id].filter((_, i) => i !== idx),
    }));
  }

  return (
    <div>
      <h3 style={{ ...typography.sectionTitle, color: color.text, margin: "2px 0 16px" }}>My properties</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {savedLocs.map((loc) => {
          const st = statusForLocation(loc, currentStage);
          const isActive = loc.id === activeId;
          return (
            <Card key={loc.id} tint={isActive ? "teal" : undefined} style={{ marginBottom: 0 }}>
              <button
                onClick={() => onSelect(loc.id)}
                style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: radius.card, background: color.tealSurface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Home size={18} color={color.tealDeep} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...typography.bodyMedium, color: color.text }}>{loc.name}</div>
                  <div style={{ ...typography.small, color: color.textSecondary }}>{loc.coords}</div>
                </div>
                <LevelPill levelKey={st.key}>{st.label}</LevelPill>
              </button>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={onAdd} style={{ ...typography.smallMedium, color: color.tealDark, background: "none", border: "none", cursor: "pointer", padding: "4px 2px" }}>
                  Change pin
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button variant="secondary" icon={Plus} onClick={onAdd}>
          Add another location
        </Button>
      </div>

      <Card style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <ShieldCheck size={18} color={color.tealDark} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ ...typography.small, color: color.textSecondary, lineHeight: 1.5 }}>
          A family compound with more than one building? Add each one separately so we can
          watch them all.
        </div>
      </Card>

      <SectionLabel>Payout history</SectionLabel>
      <PayoutCard loc={activeLoc} status={activeStatus} paid={activePaid} />

      <SectionLabel>Share this watch</SectionLabel>
      <Card>
        <div style={{ ...typography.small, color: color.textSecondary, marginBottom: 12, lineHeight: 1.4 }}>
          Add a family member's number so they get the same alerts for{" "}
          {activeLoc ? activeLoc.name.split(",")[0] : "this place"} — useful if you're not the
          one living there day to day.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: contactsForActive.length ? 12 : 0 }}>
          <input
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            placeholder="07XX XXX XXX"
            style={{ flex: 1, border: "none", background: color.surfaceMuted, borderRadius: radius.input, padding: "9px 12px", ...typography.small, color: color.text, outline: "none" }}
          />
          <button
            onClick={addContact}
            style={{ background: color.green, color: color.white, border: "none", borderRadius: radius.button, padding: "0 16px", ...typography.smallMedium, cursor: "pointer" }}
          >
            Add
          </button>
        </div>
        {contactsForActive.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {contactsForActive.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: color.surfaceMuted, borderRadius: radius.input, padding: "8px 10px" }}>
                <Users size={14} color={color.tealDark} />
                <span style={{ ...typography.small, color: color.text, flex: 1 }}>{c}</span>
                <button onClick={() => removeContact(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <X size={13} color={color.textSecondary} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SectionLabel>Notifications</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <ToggleRow
          icon={Bell}
          label="App notifications"
          sub="When the watch changes — once a day at most"
          on={pushOn}
          onChange={() => setPushOn((v) => !v)}
        />
        <ToggleRow
          icon={Route}
          label="SMS backup"
          sub="For days when your data is off or the network is slow"
          on={smsOn}
          onChange={() => setSmsOn((v) => !v)}
        />
      </div>

      <SectionLabel>Tracking more than one place</SectionLabel>
      <Card>
        <div style={{ ...typography.bodyMedium, color: color.text, marginBottom: 4 }}>
          Watching up to 4 places for KES 50 a month?
        </div>
        <div style={{ ...typography.small, color: color.textSecondary, marginBottom: 12, lineHeight: 1.4 }}>
          We're thinking about it — not live yet. Would that be worth paying for?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Yes", "Maybe", "No"].map((opt) => (
            <button
              key={opt}
              onClick={() => setMultiVote(opt)}
              style={{ flex: 1, padding: "9px 0", borderRadius: radius.button, ...typography.smallMedium, cursor: "pointer", border: "none", background: multiVote === opt ? color.tealDark : color.surfaceMuted, color: multiVote === opt ? color.white : color.text }}
            >
              {opt}
            </button>
          ))}
        </div>
        {multiVote && (
          <div style={{ ...typography.smallMedium, color: color.tealDark, marginTop: 10 }}>
            Thanks — that helps us decide what to build next.
          </div>
        )}
      </Card>

      <SectionLabel>Language</SectionLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <LangPill active={lang === "en"} onClick={() => setLang("en")} label="English" />
        <LangPill active={false} onClick={() => {}} label="Kiswahili (soon)" disabled />
      </div>

      <SectionLabel>Accessibility</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <ToggleRow
          icon={Type}
          label="Larger text"
          sub="Makes everything on screen a bit bigger"
          on={textScale === "large"}
          onChange={() => setTextScale((v) => (v === "large" ? "normal" : "large"))}
        />
        <ToggleRow
          icon={Contrast}
          label="Higher contrast"
          sub="Darker text, easier to read in bright sun"
          on={highContrast}
          onChange={() => setHighContrast((v) => !v)}
        />
      </div>

      <SectionLabel>Data</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <SettingsRow icon={Trash2} label="Delete my data" danger />
        <SettingsRow icon={Info} label="About this service and its sources" />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Info size={15} color={color.textTertiary} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ ...typography.small, color: color.textTertiary, lineHeight: 1.5 }}>
          Not an official government warning service. In an emergency, always follow guidance
          from local authorities.
        </div>
      </div>
    </div>
  );
}

function PayoutCard({ loc, status, paid }) {
  if (!loc) return null;
  const isActOrDone = status && (status.key === "act" || status.key === "done");

  if (!isActOrDone) {
    return (
      <Card>
        <div style={{ ...typography.small, color: color.textSecondary, lineHeight: 1.4 }}>
          No payout events for {loc.name.split(",")[0]} yet. If water ever reaches your home,
          it'll show up here — with the river level at the moment it triggered, and the status
          of your payout.
        </div>
      </Card>
    );
  }

  const triggerStage = loc.trigger.toFixed(2);
  const today = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <Card tint={paid ? "teal" : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ ...typography.bodyMedium, fontWeight: 700, color: color.text }}>{loc.name.split(",")[0]}</span>
        <LevelPill levelKey={paid ? "done" : "watch"}>{paid ? "Paid" : "Processing"}</LevelPill>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ ...typography.small, color: color.textSecondary }}>Triggered on</span>
        <span style={{ ...typography.smallMedium, color: color.text }}>{today}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ ...typography.small, color: color.textSecondary }}>River level at trigger</span>
        <span style={{ ...typography.smallMedium, color: color.text }}>{triggerStage} m</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ ...typography.small, color: color.textSecondary }}>Status</span>
        <span style={{ ...typography.smallMedium, color: color.text }}>
          {paid ? "Sent to your registered number" : "Being processed — usually within 48h"}
        </span>
      </div>
    </Card>
  );
}

function SectionLabel({ children }) {
  return <div style={{ ...typography.overline, color: color.textTertiary, marginBottom: 10 }}>{children}</div>;
}

function ToggleRow({ icon: Icon, label, sub, on, onChange }) {
  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 0, padding: "12px 14px" }}>
      <Icon size={16} color={color.textSecondary} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...typography.bodyMedium, color: color.text }}>{label}</div>
        <div style={{ ...typography.small, color: color.textSecondary, marginTop: 1, lineHeight: 1.3 }}>{sub}</div>
      </div>
      <button
        onClick={onChange}
        aria-pressed={on}
        style={{ width: 42, height: 24, borderRadius: radius.dot, border: "none", background: on ? color.tealDark : color.surfaceMuted, position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}
      >
        <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: radius.dot, background: color.white, transition: "left .15s" }} />
      </button>
    </Card>
  );
}

function LangPill({ active, onClick, label, disabled }: { active: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 14px",
        borderRadius: radius.button,
        ...typography.smallMedium,
        cursor: disabled ? "default" : "pointer",
        border: "none",
        background: active ? color.tealDark : color.surfaceMuted,
        color: active ? color.white : disabled ? color.placeholder : color.text,
      }}
    >
      {label}
    </button>
  );
}

function SettingsRow({ icon: Icon, label, value, danger }: { icon: any; label: string; value?: string; danger?: boolean }) {
  return (
    <button
      onClick={undefined}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: color.surface, border: "none", borderRadius: radius.card, padding: "12px 14px", cursor: "pointer" }}
    >
      <Icon size={16} color={danger ? color.error : color.textSecondary} />
      <span style={{ ...typography.bodyMedium, color: danger ? color.error : color.text, flex: 1, textAlign: "left" }}>{label}</span>
      {value && <span style={{ ...typography.small, color: color.textSecondary }}>{value}</span>}
      <ChevronRight size={14} color={color.textTertiary} />
    </button>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { key: "home", label: "Watch", icon: Droplets },
    { key: "path", label: "Path", icon: Route },
    { key: "alerts", label: "Updates", icon: Bell },
    { key: "report", label: "Report", icon: Camera },
    { key: "more", label: "More", icon: SettingsIcon },
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: color.surface, display: "flex", padding: "10px 8px 14px" }}>
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: isActive ? color.tealDark : color.textSecondary }}
          >
            <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
            <span style={{ ...typography.chartLabel, fontSize: 10.5, fontWeight: isActive ? 600 : 400 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---- shared inline styles ----
const demoRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  background: color.surfaceAlt,
  border: "none",
  borderRadius: radius.card,
  padding: "12px 14px",
  cursor: "pointer",
};
