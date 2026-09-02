import React, { useState, useMemo } from "react";
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

const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
  .uf-display { font-family: 'Fraunces', serif; }
  .uf-body { font-family: 'IBM Plex Sans', sans-serif; }
  .uf-scroll::-webkit-scrollbar { display: none; }
  /* high-contrast: darken the muted secondary-text and border colors specifically,
     rather than touching primary text or colored badges */
  .uf-hc [style*="#4A6280"] { color: #0B1B33 !important; }
  .uf-hc [style*="#5C7699"] { color: #0B1B33 !important; }
  .uf-hc [style*="#A9C6E8"] { color: #E8F1FC !important; }
  .uf-hc [style*="#DCE7F5"] { border-color: #6C89AD !important; }
  .uf-hc [style*="#D3E0F0"] { border-color: #6C89AD !important; }
`;

// ---- design tokens ----
const T = {
  paper: "#EAF2FB",
  ink: "#0F2340",
  inkSoft: "#4A6280",
  river: "#1565C0",
  riverDeep: "#0B2E63",
  riverLight: "#5B9BD5",
  sand: "#5B9BD5",
  sandLight: "#DCEAFB",
  amber: "#D98B3A",
  red: "#B8452F",
  green: "#3D7A5C",
  paid: "#3D5A80",
};

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
    color: T.red,
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
    color: T.amber,
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
    color: T.green,
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
  { id: "clear", label: "All clear here", color: T.green },
  { id: "road", label: "Water on the road", color: T.amber },
  { id: "compound", label: "Water in my compound", color: T.amber },
  { id: "house", label: "Water in my house", color: T.red },
];

function gaugePercent(stage, min = 3.8, max = 6.6) {
  const p = ((stage - min) / (max - min)) * 100;
  return Math.max(4, Math.min(96, p));
}

function statusForLocation(loc, currentStage) {
  const gap = loc.trigger - currentStage;
  if (gap <= 0) return { key: "breached", label: "Breached — payout processing", color: T.red };
  if (gap <= 0.5) return { key: "watch", label: "Watch closely", color: T.amber };
  return { key: "safe", label: "Quiet for now", color: T.green };
}

// preview-only overrides so every state can be demoed without waiting for a real flood
const PREVIEW_STATES = {
  auto: null,
  safe: { key: "safe", label: "Quiet for now", color: T.green, gap: 1.2 },
  watch: { key: "watch", label: "Watch closely", color: T.amber, gap: 0.3 },
  breached: { key: "breached", label: "Breached — payout processing", color: T.red, gap: -0.05 },
  paid: { key: "paid", label: "Payout sent", color: T.paid, gap: -0.05 },
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
  if (statusKey === "breached" || statusKey === "paid") return 4;
  if (statusKey === "watch") return 2;
  return 1;
}

function timeToImpact(gap, loc, statusKey) {
  if (statusKey === "paid") return "Payout already sent";
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
  const color = state === "fresh" ? T.green : state === "aging" ? T.amber : T.red;
  return { text, state, color };
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
          <h1
            className="uf-display"
            style={{
              fontSize: 32,
              lineHeight: 1.16,
              color: T.paper,
              margin: "16px 0 10px",
              fontWeight: 600,
            }}
          >
            Know before the river gets to you.
          </h1>
          <p
            className="uf-body"
            style={{ color: "#A9C6E8", fontSize: 14.5, lineHeight: 1.5, margin: "0 0 22px" }}
          >
            One place. Watched daily. We'll tell you if it's coming, and roughly when — not
            just how many millimetres fell somewhere upstream.
          </p>

          <div style={{ display: "flex", gap: 18, marginBottom: 4 }}>
            <Feature icon={MapPin} label="One place" sub="Home, shop or farm" />
            <Feature icon={Clock} label="Checked daily" sub="Rain and river" />
            <Feature icon={Camera} label="You report" sub="One tap" />
          </div>
        </div>

        <div
          className="uf-scroll"
          style={{
            background: T.paper,
            borderRadius: "28px 28px 0 0",
            flex: 1,
            padding: "26px 24px 32px",
            overflowY: "auto",
          }}
        >
          <button
            className="uf-body"
            onClick={() => chooseDemo(DEMO_LOCATIONS[0])}
            style={btnPrimary}
          >
            <Navigation size={18} />
            Set my location
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#D3E0F0" }} />
            <span className="uf-body" style={{ color: T.inkSoft, fontSize: 12 }}>
              or type your area
            </span>
            <div style={{ flex: 1, height: 1, background: "#D3E0F0" }} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fff",
              border: "1px solid #D3E0F0",
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 18,
            }}
          >
            <MapPin size={17} color={T.inkSoft} />
            <input
              className="uf-body"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="e.g. Bula, Iftin, Ahero market..."
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontSize: 14,
                color: T.ink,
                background: "transparent",
              }}
            />
          </div>

          <button
            className="uf-body"
            onClick={() => setShowDemoList((s) => !s)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              padding: "6px 2px",
              color: T.river,
              fontSize: 13,
              fontWeight: 600,
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
                <button
                  key={loc.id}
                  className="uf-body"
                  onClick={() => chooseDemo(loc)}
                  style={demoRow}
                >
                  <div
                    style={{ width: 8, height: 8, borderRadius: 999, background: loc.color, flexShrink: 0 }}
                  />
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>{loc.name}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{loc.tierLabel}</div>
                  </div>
                  <ChevronRight size={16} color={T.inkSoft} />
                </button>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div className="uf-body" style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 6 }}>
              Covered so far
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Kisumu", "Mombasa", "Nairobi", "Tana River — 4 sites"].map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: 11.5,
                    color: T.river,
                    background: "#DCEBFC",
                    padding: "5px 10px",
                    borderRadius: 999,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <p className="uf-body" style={{ fontSize: 11, color: T.inkSoft, lineHeight: 1.5, marginBottom: 4 }}>
            We store your place — and your number, only if you add it — to send you watch
            updates. Delete either any time from Settings.
          </p>
          <p className="uf-body" style={{ fontSize: 11, color: "#5C7699", lineHeight: 1.5 }}>
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
          <button onClick={() => setView("onboarding")} style={{ ...iconBtn, marginBottom: 18 }}>
            <ChevronLeft size={18} color={T.paper} />
          </button>
        </div>
        <div style={{ padding: "0 24px" }}>
          <h2 className="uf-display" style={{ color: T.paper, fontSize: 23, fontWeight: 600, margin: "6px 0 6px" }}>
            Is this your place?
          </h2>
          <p className="uf-body" style={{ color: "#A9C6E8", fontSize: 13.5, marginBottom: 18 }}>
            GPS can drift a little. Nudge the pin if it's not quite right — it changes how much
            warning we can give you.
          </p>
        </div>

        <div
          style={{
            margin: "0 20px",
            borderRadius: 20,
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
                background: T.paper,
                border: `4px solid ${loc.color}`,
                boxShadow: "0 0 0 6px rgba(238,243,241,0.25)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: T.paper,
            borderRadius: "28px 28px 0 0",
            flex: 1,
            marginTop: 18,
            padding: "22px 24px 32px",
          }}
        >
          <div
            className="uf-body"
            style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 18, border: "1px solid #D3E0F0" }}
          >
            <div style={{ fontWeight: 600, color: T.ink, fontSize: 15, marginBottom: 4 }}>{loc.name}</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft }}>{loc.tierLabel}</div>
          </div>
          <button className="uf-body" onClick={confirmLocation} style={btnPrimary}>
            <Check size={18} />
            Yes, watch this place
          </button>
          <button className="uf-body" onClick={() => setView("onboarding")} style={{ ...btnGhost, marginTop: 10 }}>
            Try a different pin
          </button>
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
          background: T.paper,
          borderRadius: "28px 28px 0 0",
          flex: 1,
          marginTop: -14,
          padding: "24px 20px 90px",
          overflowY: "auto",
        }}
      >
        {tab === "home" && (
          <HomeTab
            loc={active}
            status={status}
            gap={gap}
            currentStage={currentStage}
            onSeePath={() => setTab("path")}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
          />
        )}
        {tab === "path" && <PathTab loc={active} status={status} progressIndex={progressIndex} paid={paid} />}
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
            activeGap={gap}
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
      className={`uf-body${highContrast ? " uf-hc" : ""}`}
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        minHeight: 720,
        background: `linear-gradient(180deg, ${T.riverDeep} 0%, ${T.river} 55%)`,
        display: "flex",
        flexDirection: "column",
        borderRadius: 32,
        overflow: "hidden",
        boxShadow: "0 30px 60px rgba(15,59,65,0.35)",
        position: "relative",
        zoom: textScale === "large" ? 1.16 : 1,
      }}
    >
      <style>{FONT_STYLES}</style>
      {children}
    </div>
  );
}

function LogoMark({ size = 19, color = "#1E9CF2" }) {
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
        fill={color}
      />
    </svg>
  );
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.riverLight }}>
      <LogoMark size={19} />
      <span className="uf-body" style={{ fontSize: 12.5, letterSpacing: 1.4, textTransform: "uppercase" }}>
        FlowSure
      </span>
    </div>
  );
}

function Feature({ icon: Icon, label, sub }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: "rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 8px",
        }}
      >
        <Icon size={17} color={T.paper} />
      </div>
      <div className="uf-body" style={{ fontSize: 11.5, color: T.paper, fontWeight: 600 }}>{label}</div>
      <div className="uf-body" style={{ fontSize: 10, color: "#9FC3E8", marginTop: 1 }}>{sub}</div>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.1)",
            padding: "6px 10px",
            borderRadius: 999,
          }}
        >
          <MapPin size={13} color={T.paper} />
          <span style={{ fontSize: 11.5, color: T.paper }}>{loc.name.split(",")[0]}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: status.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Check size={18} color="#fff" />
        </div>
        <div>
          <p className="uf-display" style={{ color: T.paper, fontSize: 20, fontWeight: 600, margin: 0 }}>
            {status.label}
          </p>
          <p className="uf-body" style={{ color: "#A9C6E8", fontSize: 12, margin: "2px 0 0" }}>
            {timeToImpact(gap, activeLoc, status.key)}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.08)",
          padding: "5px 10px",
          borderRadius: 999,
        }}
      >
        <RefreshCw size={11} color={fresh.color} />
        <span style={{ fontSize: 11, color: "#D6E7F9" }}>{fresh.text}</span>
        {fresh.state === "stale" && (
          <span style={{ fontSize: 11, color: T.amber, fontWeight: 600 }}>· data may be delayed</span>
        )}
      </div>

      {(status.key === "watch" || status.key === "breached") && loc.shelter && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          <Landmark size={16} color={T.paper} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: T.paper, lineHeight: 1.3 }}>
            Nearest higher ground: <strong>{loc.shelter.name}</strong> · {loc.shelter.distanceKm} km away
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: status.color,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: 999,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: "#fff" }} />
      {status.label}
    </span>
  );
}

function WaterGauge({ currentStage, trigger }) {
  const cur = gaugePercent(currentStage);
  const trg = gaugePercent(trigger);

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-end" }}>
      <div
        style={{
          position: "relative",
          width: 44,
          height: 132,
          borderRadius: 14,
          background: "#D7E6F7",
          overflow: "hidden",
          border: "1px solid #C3D9F2",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, bottom: `${trg}%`, borderTop: `2px solid ${T.red}` }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${cur}%`,
            background: `linear-gradient(180deg, ${T.riverLight}, ${T.river})`,
            transition: "height 0.6s ease",
          }}
        />
        <div style={{ position: "absolute", top: 8, left: 0, right: 0, textAlign: "center" }}>
          <Home size={15} color={T.ink} style={{ opacity: 0.5 }} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <LegendRow color={T.river} label="River level today" value={`${currentStage.toFixed(1)} m`} />
        <LegendRow color={T.red} label="Level that reaches your home" value={`${trigger.toFixed(2)} m`} />
        <div style={{ fontSize: 11, color: T.inkSoft, lineHeight: 1.4 }}>
          Your home sits {trigger > 5.6 ? "well back from" : trigger > 5.1 ? "a short walk from" : "right by"} the
          river — that's why the line is where it is.
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 14, height: 3, background: color, borderRadius: 2 }} />
      <div style={{ fontSize: 11.5, color: T.inkSoft, flex: 1 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Outlook14Day() {
  const max = Math.max(...OUTLOOK_14D);
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "16px 18px", border: "1px solid #DCE7F5", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 12.5, color: T.inkSoft }}>Next 14 days</div>
        <div style={{ fontSize: 11, color: T.inkSoft }}>chance of a big flood, per day</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
        {OUTLOOK_14D.map((v, i) => (
          <div
            key={i}
            title={`${v}%`}
            style={{
              flex: 1,
              height: `${Math.max(6, (v / max) * 100)}%`,
              background: v >= 18 ? T.red : v >= 8 ? T.amber : T.riverLight,
              borderRadius: 3,
              opacity: 0.9,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "#5C7699" }}>Today</span>
        <span style={{ fontSize: 10, color: "#5C7699" }}>+14 days</span>
      </div>
      <div style={{ fontSize: 10.5, color: "#5C7699", marginTop: 8, lineHeight: 1.4 }}>
        Peaks around day 7 — based on 50 weather-model runs. Still a forecast, not a certainty.
      </div>
    </div>
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
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10.5, color: "#5C7699", marginBottom: 6 }}>
        PREVIEW A STATE (for this demo only)
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {modes.map((m) => (
          <button
            key={m.key}
            className="uf-body"
            onClick={() => setPreviewMode(m.key)}
            style={{
              flex: 1,
              padding: "7px 0",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 9,
              cursor: "pointer",
              border: `1.5px solid ${previewMode === m.key ? T.river : "#DCE7F5"}`,
              background: previewMode === m.key ? T.river : "#fff",
              color: previewMode === m.key ? "#fff" : T.inkSoft,
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
    <div style={{ background: "#fff", borderRadius: 20, padding: "16px 18px", border: "1px solid #DCE7F5", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <History size={15} color={T.river} />
        <div style={{ fontSize: 12.5, color: T.inkSoft }}>Has this happened before?</div>
      </div>
      {has ? (
        <div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>
          This spot has flooded in {loc.history.join(", ")}.
        </div>
      ) : (
        <div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>
          No recorded floods here yet — but that can change as the model learns more.
        </div>
      )}
    </div>
  );
}

function HomeTab({ loc, status, gap, currentStage, onSeePath, previewMode, setPreviewMode }) {
  const [range, setRange] = useState("7d");
  const data = range === "7d" ? STAGE_HISTORY : STAGE_HISTORY_30D;
  // gap is always (trigger - stage), so this stays correct whether we're in
  // the live reading or a previewed state
  const displayStage = loc.trigger - gap;

  return (
    <div>
      <PreviewSwitcher previewMode={previewMode} setPreviewMode={setPreviewMode} />

      <div
        style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #DCE7F5", marginBottom: 16 }}
      >
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 12 }}>Right now, at your place</div>
        <WaterGauge currentStage={displayStage} trigger={loc.trigger} />
      </div>

      <div style={{ background: "#fff", borderRadius: 20, padding: "16px 18px", border: "1px solid #DCE7F5", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, color: T.inkSoft }}>River level trend</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["7d", "30d"].map((r) => (
              <button
                key={r}
                className="uf-body"
                onClick={() => setRange(r)}
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "4px 9px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: `1px solid ${range === r ? T.river : "#DCE7F5"}`,
                  background: range === r ? T.river : "#fff",
                  color: range === r ? "#fff" : T.inkSoft,
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
              <defs>
                <linearGradient id="stageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.river} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={T.river} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.inkSoft }} axisLine={false} tickLine={false} interval={range === "30d" ? 1 : 0} />
              <YAxis hide domain={[3.8, 6.6]} />
              <ReferenceLine y={loc.trigger} stroke={T.red} strokeDasharray="4 3" strokeWidth={1.5} />
              <Tooltip formatter={(v) => [`${v} m`, "River level"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="stage" stroke={T.river} strokeWidth={2} fill="url(#stageFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 4 }}>
          Dashed line marks the level that would reach your home.
        </div>
      </div>

      <Outlook14Day />

      <HistoryCard loc={loc} />

      <button className="uf-body" onClick={onSeePath} style={btnGhost}>
        <Route size={16} />
        See the water's path to you
      </button>
    </div>
  );
}

function PathTab({ loc, status, progressIndex, paid }) {
  const nextCp = CHECKPOINTS[Math.min(progressIndex, CHECKPOINTS.length - 1)];
  const atFinal = progressIndex >= CHECKPOINTS.length;
  const progressPct = (Math.min(progressIndex, 4) / 4) * 100;

  return (
    <div>
      <h3 className="uf-display" style={{ fontSize: 19, color: T.ink, margin: "2px 0 4px" }}>
        The water's path to you
      </h3>
      <p style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 16 }}>
        From the hills where it starts, to your door. Only the last step means a payout — the
        rest are just so you're never caught off guard.
      </p>

      {/* mini-map style overall progress */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #DCE7F5", padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, color: T.inkSoft }}>Progress along the path</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.river }}>
            {atFinal ? "Reached" : `Step ${progressIndex} of 4`}
          </span>
        </div>
        <div style={{ position: "relative", height: 8, background: "#D7E6F7", borderRadius: 999 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progressPct}%`,
              borderRadius: 999,
              background: atFinal ? (paid ? T.paid : T.red) : T.river,
              transition: "width 0.5s ease",
            }}
          />
          <Droplets
            size={14}
            color={atFinal ? (paid ? T.paid : T.red) : T.river}
            style={{
              position: "absolute",
              top: -4,
              left: `calc(${progressPct}% - 7px)`,
              transition: "left 0.5s ease",
            }}
          />
        </div>
        {!atFinal && (
          <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 8 }}>
            Next: <strong style={{ color: T.ink }}>{nextCp.title}</strong> — a modeled estimate,
            not a guarantee.
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          paddingBottom: 6,
          marginBottom: 20,
        }}
        className="uf-scroll"
      >
        {loc.upstream.map((u, i) => (
          <div key={i} style={{ flex: "0 0 auto", textAlign: "center", minWidth: 84 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: T.ink }}>{u.label}</div>
            <div style={{ fontSize: 10.5, color: T.inkSoft }}>~{u.hoursAway}h to you</div>
          </div>
        ))}
        <div style={{ flex: "0 0 auto", textAlign: "center", minWidth: 84 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.river }}>Your place</div>
          <div style={{ fontSize: 10.5, color: T.inkSoft }}>you are here</div>
        </div>
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
                    borderRadius: 999,
                    background: isPaidFinal
                      ? T.paid
                      : passed
                      ? (cp.kind === "trigger" ? T.red : T.river)
                      : "#D7E6F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {passed ? <Check size={15} color="#fff" /> : <span style={{ fontSize: 12, color: T.inkSoft }}>{stepNum}</span>}
                </div>
                {i < CHECKPOINTS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 32, background: stepNum < progressIndex ? T.river : "#D7E6F7" }} />
                )}
              </div>
              <div style={{ paddingBottom: 22 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: cp.kind === "trigger" ? (isPaidFinal ? T.paid : T.red) : T.inkSoft,
                    marginBottom: 2,
                  }}
                >
                  {cp.kind === "trigger" ? (isPaidFinal ? "Payout sent" : "Insurance trigger") : "Early warning"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{cp.title}</div>
                {cp.detail && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{cp.detail}</div>}
                {passed && cp.action && (
                  <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4, fontStyle: "italic" }}>
                    {cp.action}
                  </div>
                )}
                {isCurrent && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-block",
                      fontSize: 11.5,
                      color: T.river,
                      background: "#DCEBFC",
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    We're here now
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
      <h3 className="uf-display" style={{ fontSize: 19, color: T.ink, margin: "2px 0 4px" }}>
        Alerts
      </h3>
      <p style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 16 }}>
        Every step the water takes toward {loc.name.split(",")[0]}, in order — with what to do
        about it.
      </p>

      {feed.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #DCE7F5", borderRadius: 16, padding: 18, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.inkSoft }}>
            No alerts yet — we're quietly watching this place for you.
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {feed.map((a, i) => {
          const isTrigger = a.kind === "trigger";
          const isPaidEvent = isTrigger && paid;
          return (
            <div
              key={i}
              style={{
                background: "#fff",
                border: `1px solid ${isTrigger ? (isPaidEvent ? T.paid : T.red) : "#DCE7F5"}`,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: isTrigger ? (isPaidEvent ? T.paid : T.red) : T.river,
                  }}
                >
                  {isTrigger ? (isPaidEvent ? "Payout" : "Insurance trigger") : "Early warning"}
                </span>
                <span style={{ fontSize: 11, color: T.inkSoft }}>
                  {a.time.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {", "}
                  {a.time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.4 }}>{a.action}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          border: "1px solid #DCE7F5",
          borderRadius: 16,
          padding: 14,
        }}
      >
        <Bell size={17} color={T.river} />
        <div style={{ fontSize: 12, color: T.inkSoft }}>
          You'll also get these by SMS, in case the network is slow.
        </div>
      </div>
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
      <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 600, marginBottom: 10 }}>
        WHAT NEIGHBOURS ARE SEEING
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {reports.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: "1px solid #DCE7F5", borderRadius: 14, padding: "10px 12px" }}>
            <Users size={15} color={T.riverLight} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 500 }}>{r.what}</div>
              <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 1 }}>{r.who} · {r.when}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTab({ loc, reportSent, onSend }) {
  return (
    <div>
      <h3 className="uf-display" style={{ fontSize: 19, color: T.ink, margin: "2px 0 4px" }}>
        What are you seeing?
      </h3>
      <p style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 18 }}>
        One tap. Your reports help us warn the next person faster — and help us get the model
        right.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {REPORT_OPTIONS.map((opt) => {
          const isSelected = reportSent === opt.id;
          return (
            <button
              key={opt.id}
              className="uf-body"
              onClick={() => onSend(opt.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                background: isSelected ? opt.color : "#fff",
                border: `1.5px solid ${isSelected ? opt.color : "#DCE7F5"}`,
                borderRadius: 16,
                padding: "14px 16px",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: isSelected ? "#fff" : opt.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#fff" : T.ink, flex: 1, textAlign: "left" }}>
                {opt.label}
              </span>
              {isSelected && <Check size={16} color="#fff" />}
            </button>
          );
        })}
      </div>

      {reportSent && (
        <div
          style={{
            background: "#DCEBFC",
            border: `1px solid ${T.river}`,
            borderRadius: 14,
            padding: 14,
            fontSize: 12.5,
            color: T.river,
            marginBottom: 18,
          }}
        >
          Thanks — sent for {loc.name.split(",")[0]} just now. Neighbours nearby will see this
          reflected in their watch too.
        </div>
      )}

      <button className="uf-body" style={{ ...btnGhost }}>
        <Camera size={16} />
        Add a photo (optional)
      </button>

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
  activeGap,
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
      <h3 className="uf-display" style={{ fontSize: 19, color: T.ink, margin: "2px 0 16px" }}>
        My properties
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {savedLocs.map((loc) => {
          const st = statusForLocation(loc, currentStage);
          const isActive = loc.id === activeId;
          return (
            <div
              key={loc.id}
              style={{
                background: "#fff",
                border: isActive ? `1.5px solid ${T.river}` : "1px solid #DCE7F5",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <button
                onClick={() => onSelect(loc.id)}
                className="uf-body"
                style={{
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: T.sandLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Home size={18} color={T.river} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{loc.name}</div>
                  <div style={{ fontSize: 11.5, color: T.inkSoft }}>{loc.coords}</div>
                </div>
                <StatusPill status={st} />
              </button>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={onAdd} className="uf-body" style={changeBtn}>
                  Change pin
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onAdd} className="uf-body" style={{ ...btnGhost, marginBottom: 16 }}>
        <Plus size={16} />
        Add another location
      </button>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fff", border: "1px solid #DCE7F5", borderRadius: 16, padding: 14, marginBottom: 20 }}>
        <ShieldCheck size={18} color={T.river} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>
          A family compound with more than one building? Add each one separately so we can
          watch them all.
        </div>
      </div>

      <SectionLabel>Payout history</SectionLabel>
      <PayoutCard loc={activeLoc} status={activeStatus} gap={activeGap} paid={activePaid} />

      <SectionLabel>Share this watch</SectionLabel>
      <div style={{ background: "#fff", border: "1px solid #DCE7F5", borderRadius: 16, padding: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 12, lineHeight: 1.4 }}>
          Add a family member's number so they get the same alerts for{" "}
          {activeLoc ? activeLoc.name.split(",")[0] : "this place"} — useful if you're not the
          one living there day to day.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: contactsForActive.length ? 12 : 0 }}>
          <input
            className="uf-body"
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            placeholder="07XX XXX XXX"
            style={{
              flex: 1,
              border: "1px solid #D3E0F0",
              borderRadius: 10,
              padding: "9px 12px",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            className="uf-body"
            onClick={addContact}
            style={{
              background: T.river,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "0 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
        {contactsForActive.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {contactsForActive.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#EFF5FC", borderRadius: 10, padding: "8px 10px" }}>
                <Users size={14} color={T.river} />
                <span style={{ fontSize: 12.5, color: T.ink, flex: 1 }}>{c}</span>
                <button
                  onClick={() => removeContact(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <X size={13} color={T.inkSoft} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
      <div style={{ background: "#fff", border: "1px solid #DCE7F5", borderRadius: 16, padding: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
          Watching up to 4 places for KES 50 a month?
        </div>
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 12, lineHeight: 1.4 }}>
          We're thinking about it — not live yet. Would that be worth paying for?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Yes", "Maybe", "No"].map((opt) => (
            <button
              key={opt}
              className="uf-body"
              onClick={() => setMultiVote(opt)}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                border: `1.5px solid ${multiVote === opt ? T.river : "#DCE7F5"}`,
                background: multiVote === opt ? T.river : "#fff",
                color: multiVote === opt ? "#fff" : T.ink,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
        {multiVote && (
          <div style={{ fontSize: 11.5, color: T.river, marginTop: 10 }}>
            Thanks — that helps us decide what to build next.
          </div>
        )}
      </div>

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
          sub="Darker text and borders, easier to read in bright sun"
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
        <Info size={15} color="#5C7699" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11, color: "#5C7699", lineHeight: 1.5 }}>
          Not an official government warning service. In an emergency, always follow guidance
          from local authorities.
        </div>
      </div>
    </div>
  );
}

function PayoutCard({ loc, status, gap, paid }) {
  if (!loc) return null;
  const isBreachedOrPaid = status && (status.key === "breached" || status.key === "paid");

  if (!isBreachedOrPaid) {
    return (
      <div style={{ background: "#fff", border: "1px solid #DCE7F5", borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.4 }}>
          No payout events for {loc.name.split(",")[0]} yet. If water ever reaches your home,
          it'll show up here — with the river level at the moment it triggered, and the status
          of your payout.
        </div>
      </div>
    );
  }

  const triggerStage = loc.trigger.toFixed(2);
  const today = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${paid ? T.paid : T.red}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{loc.name.split(",")[0]}</span>
        <StatusPill status={{ label: paid ? "Paid" : "Processing", color: paid ? T.paid : T.amber }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.inkSoft }}>Triggered on</span>
        <span style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{today}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.inkSoft }}>River level at trigger</span>
        <span style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{triggerStage} m</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: T.inkSoft }}>Status</span>
        <span style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>
          {paid ? "Sent to your registered number" : "Being processed — usually within 48h"}
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 600, letterSpacing: 0.3, marginBottom: 10 }}>
      {children.toString().toUpperCase()}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, sub, on, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#fff",
        border: "1px solid #DCE7F5",
        borderRadius: 14,
        padding: "12px 14px",
      }}
    >
      <Icon size={16} color={T.inkSoft} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 1, lineHeight: 1.3 }}>{sub}</div>
      </div>
      <button
        onClick={onChange}
        aria-pressed={on}
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          border: "none",
          background: on ? T.river : "#D7E6F7",
          position: "relative",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background .15s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: on ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "#fff",
            transition: "left .15s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

function LangPill({ active, onClick, label, disabled }) {
  return (
    <button
      className="uf-body"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 14px",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        border: `1.5px solid ${active ? T.river : "#DCE7F5"}`,
        background: active ? T.river : "#fff",
        color: active ? "#fff" : disabled ? "#9FB3CC" : T.ink,
      }}
    >
      {label}
    </button>
  );
}

function SettingsRow({ icon: Icon, label, value, danger }) {
  return (
    <button
      className="uf-body"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        background: "#fff",
        border: "1px solid #DCE7F5",
        borderRadius: 14,
        padding: "12px 14px",
        cursor: "pointer",
      }}
    >
      <Icon size={16} color={danger ? T.red : T.inkSoft} />
      <span style={{ fontSize: 13, color: danger ? T.red : T.ink, flex: 1, textAlign: "left", fontWeight: 500 }}>
        {label}
      </span>
      {value && <span style={{ fontSize: 12, color: T.inkSoft }}>{value}</span>}
      <ChevronRight size={14} color="#9FB3CC" />
    </button>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { key: "home", label: "Watch", icon: Droplets },
    { key: "path", label: "Path", icon: Route },
    { key: "alerts", label: "Alerts", icon: Bell },
    { key: "report", label: "Report", icon: Camera },
    { key: "more", label: "More", icon: SettingsIcon },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #DCE7F5",
        display: "flex",
        padding: "10px 8px 14px",
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            className="uf-body"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isActive ? T.river : T.inkSoft,
            }}
          >
            <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 400 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---- shared inline styles ----
const btnPrimary = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: T.river,
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "14px 16px",
  fontSize: 14.5,
  fontWeight: 600,
  cursor: "pointer",
};

const btnGhost = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "transparent",
  color: T.river,
  border: `1.5px solid ${T.river}`,
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const demoRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  background: "#fff",
  border: "1px solid #DCE7F5",
  borderRadius: 14,
  padding: "12px 14px",
  cursor: "pointer",
};

const changeBtn = {
  fontSize: 11.5,
  fontWeight: 600,
  color: T.river,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 2px",
};

const iconBtn = {
  width: 34,
  height: 34,
  borderRadius: 999,
  background: "rgba(255,255,255,0.12)",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
