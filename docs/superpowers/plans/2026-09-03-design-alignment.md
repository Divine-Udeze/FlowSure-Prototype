# FlowSure UI Design-Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `src/FlowSure.tsx` into compliance with `DESIGN.md` — flat colour, no gradients, no borders, the platform colour/type/radius/spacing scale, and the spec's copy rules — without touching map rendering (out of scope per user).

**Architecture:** Extract `DESIGN.md`'s tokens into `src/theme.ts` and its component anatomy into `src/components/ui.tsx` (the two files `DESIGN.md` itself says they live in), then refactor `FlowSure.tsx` screen-by-screen to consume them, deleting the local `T` token object and all inline one-off styles as each screen is converted.

**Tech Stack:** React 19 + TypeScript (Vite, `tsc` in non-strict mode), `lucide-react` icons, `recharts` for the trend chart. No test runner is configured in this repo (`package.json` has no test script/framework) — verification in this plan is `tsc` type-checking plus visual QA via `npm run dev`, using the app's existing `PreviewSwitcher` to hit every status state (safe/watch/breached/paid) without waiting on live data.

## Global Constraints

- **No gradients** anywhere — no `linear-gradient`/`radial-gradient` in styles, code, or SVG `<linearGradient>` defs. (`DESIGN.md` §1 rule 2)
- **No borders** — no `border`/`borderTop`/`borderRight`/etc. CSS properties on any container, card, input, button, or row. Separation comes from whitespace and ground contrast only. Data marks (chart line/dashed trigger line, map strokes) are exempt — map is out of scope this pass, chart line stays. (`DESIGN.md` §1 rule 3, §5)
- **One accent per surface** — a card carries at most one accent colour; success/warning/error are reserved for state, never decoration. (`DESIGN.md` §1 rule 4)
- **Colour tokens**: only values from `src/theme.ts` (transcribed verbatim from `DESIGN.md` §2). Text on a tinted surface always uses that tint's `*Text` token, never the base hue. (`DESIGN.md` §2 rules)
- **Radius scale**: 6 (inputs), 8 (notices), 10 (buttons), 12 (cards/tiles/hero), 16 (sheets), 48 (pills), 999 (dots) — no other radius values. (`DESIGN.md` §4)
- **Spacing scale**: 4, 8, 10, 12, 14, 16, 20, 24, 32, 48. Between cards: 12px. Card padding: 16px. (`DESIGN.md` §4, §6)
- **Shadows**: only `shadow.overlay`, only on floating elements (the help sheet). In-flow layout never casts a shadow. (`DESIGN.md` §4)
- **Typography**: Inter Tight for UI, Inter for headings — no other font family. (`DESIGN.md` §5)
- **Copy**: "Watch / trigger / exceedance / chance" — never "warning" or "alert" in user-facing text. (`DESIGN.md` §9)
- **Out of scope**: the map/`MapDecor` SVG blob on the Confirm screen stays as-is — do not touch its rendering, only the card chrome around it if it uses banned styles.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/theme.ts` | **New.** Colour, level-status, space, radius, shadow, typography tokens — verbatim from `DESIGN.md` §2–§6. |
| `src/components/ui.tsx` | **New.** Shared primitives: `Card`, `Button`, `Pill`, `LevelPill`, `Notice`, `Divider`, `Stat`, `Meter`, `IconTile`, `SeverityTile`, `HelpDot`, `HelpSheet`, `Expandable`, `WaveStrip`. |
| `src/style.css` | **Modify.** Swap the Fraunces/IBM Plex Sans font import for Inter Tight + Inter; delete the unused Vite-scaffold rules (`#app`, `.hero`, `#next-steps`, `#docs`, `#spacer`, `.ticks`, `.counter`) — none are referenced by `FlowSure.tsx`. |
| `src/FlowSure.tsx` | **Modify.** Delete local `T` token object and `btnPrimary`/`btnGhost`/`demoRow`/`changeBtn`/`iconBtn` style constants; import from `theme.ts`/`ui.tsx`; rewrite every screen to use them. |

---

### Task 1: Design tokens — `src/theme.ts`

**Files:**
- Create: `src/theme.ts`

**Interfaces:**
- Produces: `color`, `level`, `space`, `radius`, `shadow`, `typography` — consumed by every later task.

- [ ] **Step 1: Write the file**

```ts
// src/theme.ts
// Tokens transcribed verbatim from DESIGN.md §2 (Colour), §3 (Grounds),
// §4 (Spacing/radius/shadow) and §5 (Typography).

export const color = {
  page: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  surfaceMuted: '#EEF2F6',

  mint: '#F4FBF9',
  mintDeep: '#EDF8F9',
  tealSurface: '#ECF8FC',
  tealSurfaceSoft: '#F3FBFF',

  brandDark: '#061C1D',
  brandDeep: '#004B50',

  text: '#0A0C15',
  textSecondary: '#525965',
  textTertiary: '#717984',
  placeholder: '#909CAD',

  green: '#174B29',
  greenText: '#107138',

  teal: '#45B6E5',
  tealDark: '#3792B7',
  tealDeep: '#296D89',

  copper: '#A7553F',
  copperText: '#753B2C',
  copperSurface: '#F6EEEC',
  copperBorder: '#CC9C90',

  success: '#38C793',
  successText: '#107138',
  successSurface: '#EDF9F4',
  successBorder: '#9DE4CB',

  warning: '#FA8C16',
  warningText: '#B57B00',
  warningSurface: '#FEF3EB',
  warningBorder: '#FBD5AE',

  error: '#DF1C41',
  errorDark: '#AF1D38',
  errorSurface: '#FDEDF0',
  errorBorder: '#F8C9D2',

  // Neutral FILLS only — never draw these as a border/stroke (DESIGN.md rule 3).
  fill: '#E8EDF3',
  fillSubtle: '#E1E4E9',
  fillStrong: '#D7DBE2',
  fillInput: '#CACAD4',

  white: '#FFFFFF',
} as const;

// DESIGN.md §2: "quiet = success, watch = warning, act = error, major = error
// dark with white text." `done` is a FlowSure-specific fifth state (a
// completed/paid payout) with no equivalent in DESIGN.md's four levels; per
// rule 4 the semantic success/warning/error set is reserved for state and
// never decoration, so `done` borrows the platform's teal instead of
// inventing a new semantic colour.
export const level = {
  quiet: { fill: color.success, text: color.successText, surface: color.successSurface },
  watch: { fill: color.warning, text: color.warningText, surface: color.warningSurface },
  act: { fill: color.error, text: color.white, surface: color.errorSurface },
  major: { fill: color.errorDark, text: color.white, surface: color.errorSurface },
  done: { fill: color.tealDeep, text: color.white, surface: color.tealSurface },
} as const;

export type LevelKey = keyof typeof level;

export const space = [0, 4, 8, 10, 12, 14, 16, 20, 24, 32, 48] as const;

export const radius = {
  input: 6,
  notice: 8,
  button: 10,
  card: 12,
  sheet: 16,
  pill: 48,
  dot: 999,
} as const;

export const shadow = {
  overlay: '0 12px 24px rgba(10, 12, 21, 0.14)',
} as const;

export const typography = {
  display: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 32, lineHeight: '38px', letterSpacing: -1.3 },
  cardTitle: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 24, lineHeight: '32px', letterSpacing: -0.8 },
  pageTitle: { fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 20, lineHeight: '28px', letterSpacing: -0.4 },
  sectionTitle: { fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 16, lineHeight: '24px', letterSpacing: -0.3 },
  stat: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 600, fontSize: 20, lineHeight: '24px', letterSpacing: -0.8 },
  body: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: -0.2 },
  bodyMedium: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 500, fontSize: 14, lineHeight: '20px', letterSpacing: -0.2 },
  small: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 400, fontSize: 12, lineHeight: '16px', letterSpacing: 0 },
  smallMedium: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 500, fontSize: 12, lineHeight: '16px', letterSpacing: 0 },
  overline: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 500, fontSize: 11, lineHeight: '16px', letterSpacing: 1.2, textTransform: 'uppercase' as const },
  chartLabel: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 400, fontSize: 10, lineHeight: '12px', letterSpacing: 0 },
} as const;
```

- [ ] **Step 2: Verify it compiles standalone**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `theme.ts` (errors elsewhere in `FlowSure.tsx` are expected until later tasks — ignore those for now).

- [ ] **Step 3: Commit**

```bash
git add src/theme.ts
git commit -m "feat: add DESIGN.md token file"
```

---

### Task 2: Shared UI primitives — `src/components/ui.tsx`

**Files:**
- Create: `src/components/ui.tsx`

**Interfaces:**
- Consumes: `color`, `level`, `space`, `radius`, `shadow`, `typography` from `src/theme.ts` (Task 1).
- Produces: `Card`, `Button`, `Pill`, `LevelPill`, `Notice`, `Divider`, `Stat`, `Meter`, `IconTile`, `SeverityTile`, `HelpDot`, `HelpSheet`, `Expandable`, `WaveStrip` — consumed by Tasks 4–12.

- [ ] **Step 1: Write the file**

```tsx
// src/components/ui.tsx
import { useState, type ReactNode, type ComponentType, type CSSProperties } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { color, level, space, radius, shadow, typography, type LevelKey } from '../theme';

type IconType = ComponentType<{ size?: number; color?: string }>;

// ---- Card (DESIGN.md §7: white/tinted surface, radius 12, padding 16, one overline) ----
export type CardTint = 'mint' | 'teal' | 'alt' | 'muted';

export function Card({
  tint,
  overline,
  children,
  style,
}: {
  tint?: CardTint;
  overline?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const bg =
    tint === 'mint' ? color.mint : tint === 'teal' ? color.tealSurface : tint === 'alt' ? color.surfaceAlt : tint === 'muted' ? color.surfaceMuted : color.surface;
  return (
    <div style={{ background: bg, borderRadius: radius.card, padding: space[6], marginBottom: space[4], ...style }}>
      {overline && <div style={{ ...typography.overline, color: color.textTertiary, marginBottom: space[3] }}>{overline}</div>}
      {children}
    </div>
  );
}

// ---- Button (DESIGN.md §7: primary green 48px radius 10; secondary surfaceMuted; danger errorSurface) ----
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

const BUTTON_STYLES: Record<ButtonVariant, { bg: string; fg: string }> = {
  primary: { bg: color.green, fg: color.white },
  secondary: { bg: color.surfaceMuted, fg: color.tealDark },
  danger: { bg: color.errorSurface, fg: color.errorDark },
};

export function Button({
  variant = 'primary',
  icon: Icon,
  children,
  onClick,
  disabled,
  style,
}: {
  variant?: ButtonVariant;
  icon?: IconType;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const v = BUTTON_STYLES[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[2],
        border: 'none',
        borderRadius: radius.button,
        padding: '0 16px',
        fontFamily: typography.bodyMedium.fontFamily,
        fontWeight: typography.bodyMedium.fontWeight,
        fontSize: typography.bodyMedium.fontSize,
        letterSpacing: typography.bodyMedium.letterSpacing,
        background: v.bg,
        color: v.fg,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {Icon && <Icon size={18} color={v.fg} />}
      {children}
    </button>
  );
}

// ---- Pill / LevelPill (DESIGN.md §7: 24/32px, radius 48, tone-tinted fill, optional dot) ----
export type PillTone = 'green' | 'teal' | 'copper' | 'success' | 'warning' | 'error' | 'neutral';

const PILL_TONES: Record<PillTone, { bg: string; fg: string }> = {
  green: { bg: color.mint, fg: color.greenText },
  teal: { bg: color.tealSurface, fg: color.tealDeep },
  copper: { bg: color.copperSurface, fg: color.copperText },
  success: { bg: color.successSurface, fg: color.successText },
  warning: { bg: color.warningSurface, fg: color.warningText },
  error: { bg: color.errorSurface, fg: color.errorDark },
  neutral: { bg: color.surfaceMuted, fg: color.textSecondary },
};

export function Pill({ tone = 'neutral', size = 24, dot, children }: { tone?: PillTone; size?: 24 | 32; dot?: boolean; children: ReactNode }) {
  const t = PILL_TONES[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: size,
        padding: `0 ${size === 32 ? 14 : 10}px`,
        borderRadius: radius.pill,
        background: t.bg,
        color: t.fg,
        fontFamily: typography.smallMedium.fontFamily,
        fontWeight: typography.smallMedium.fontWeight,
        fontSize: typography.smallMedium.fontSize,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: radius.dot, background: t.fg, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

export function LevelPill({ levelKey, children }: { levelKey: LevelKey; children: ReactNode }) {
  const l = level[levelKey];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 24,
        padding: '0 10px',
        borderRadius: radius.pill,
        background: l.fill,
        color: l.text,
        fontFamily: typography.smallMedium.fontFamily,
        fontWeight: typography.smallMedium.fontWeight,
        fontSize: typography.smallMedium.fontSize,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: radius.dot, background: l.text, flexShrink: 0 }} />
      {children}
    </span>
  );
}

// ---- Notice (DESIGN.md §7: tinted block, small text in the tint's text colour, one line) ----
export type NoticeTone = 'success' | 'warning' | 'error' | 'neutral';

const NOTICE_TONES: Record<NoticeTone, { bg: string; fg: string }> = {
  success: { bg: color.successSurface, fg: color.successText },
  warning: { bg: color.warningSurface, fg: color.warningText },
  error: { bg: color.errorSurface, fg: color.errorDark },
  neutral: { bg: color.surfaceMuted, fg: color.textSecondary },
};

export function Notice({ tone = 'neutral', children }: { tone?: NoticeTone; children: ReactNode }) {
  const t = NOTICE_TONES[tone];
  return (
    <div style={{ background: t.bg, color: t.fg, borderRadius: radius.notice, padding: '10px 12px', fontFamily: typography.small.fontFamily, fontSize: typography.small.fontSize, lineHeight: typography.small.lineHeight }}>
      {children}
    </div>
  );
}

// ---- Divider (DESIGN.md §4: "Divider renders space, not a line") ----
export function Divider({ size = 20 }: { size?: number }) {
  return <div style={{ height: size }} />;
}

// ---- Stat (DESIGN.md §7: surfaceAlt tile, value 20px/unit 12px/label 12px with 6px tone dot) ----
export function Stat({ value, unit, label, toneColor }: { value: string; unit?: string; label: string; toneColor?: string }) {
  return (
    <div style={{ background: color.surfaceAlt, borderRadius: radius.card, padding: space[4], flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ ...typography.stat, color: color.text }}>{value}</span>
        {unit && <span style={{ ...typography.small, color: color.textSecondary }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        {toneColor && <span style={{ width: 6, height: 6, borderRadius: radius.dot, background: toneColor, flexShrink: 0 }} />}
        <span style={{ ...typography.small, color: color.textSecondary }}>{label}</span>
      </div>
    </div>
  );
}

// ---- Meter (DESIGN.md §7: label+icon, "value / max unit", 8px track, green<50%/orange<100%/red>=100%, full at trigger) ----
export function Meter({ icon: Icon, label, value, max, unit }: { icon?: IconType; label: string; value: number; max: number; unit: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = pct >= 100 ? color.error : pct >= 50 ? color.warning : color.success;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {Icon && <Icon size={14} color={color.textSecondary} />}
        <span style={{ ...typography.small, color: color.textSecondary, flex: 1 }}>{label}</span>
        <span style={{ fontFamily: typography.stat.fontFamily, fontWeight: typography.stat.fontWeight, fontSize: 14, color: color.text }}>
          {value.toFixed(2)} / {max.toFixed(2)} {unit}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: radius.dot, background: color.surfaceMuted, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: radius.dot, background: fill, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ---- IconTile (DESIGN.md §7: 44px tinted icon square, 2-word title, 3-word caption) ----
export function IconTile({ icon: Icon, title, caption, tint = 'mint' }: { icon: IconType; title: string; caption: string; tint?: 'mint' | 'teal' }) {
  const bg = tint === 'teal' ? color.tealSurface : color.mint;
  const fg = tint === 'teal' ? color.tealDeep : color.greenText;
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: radius.card, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
        <Icon size={20} color={fg} />
      </div>
      <div style={{ ...typography.smallMedium, color: color.text }}>{title}</div>
      <div style={{ ...typography.small, color: color.textSecondary, marginTop: 2 }}>{caption}</div>
    </div>
  );
}

// ---- SeverityTile (DESIGN.md §7: 84px tile, icon + 2 words, selected = tealDark fill) ----
export function SeverityTile({ icon: Icon, label, selected, onClick }: { icon: IconType; label: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 84,
        height: 84,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        border: 'none',
        borderRadius: radius.card,
        background: selected ? color.tealDark : color.surfaceAlt,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <Icon size={20} color={selected ? color.white : color.textSecondary} />
      <span style={{ ...typography.small, color: selected ? color.white : color.text, textAlign: 'center' }}>{label}</span>
    </button>
  );
}

// ---- HelpDot / HelpSheet (DESIGN.md §7: 16px "?" glyph, 44px hit area; bottom sheet, radius 16, muted handle) ----
export function HelpDot({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="More info"
      style={{ width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
    >
      <HelpCircle size={16} color={color.textTertiary} />
    </button>
  );
}

export function HelpSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(10,12,21,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', background: color.surface, borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`, padding: '10px 20px 28px', boxShadow: shadow.overlay }}
      >
        <div style={{ width: 36, height: 4, borderRadius: radius.dot, background: color.surfaceMuted, margin: '0 auto 16px' }} />
        <div style={{ ...typography.sectionTitle, color: color.text, marginBottom: 8 }}>{title}</div>
        <div style={{ ...typography.body, color: color.textSecondary, lineHeight: 1.5 }}>{children}</div>
        <Button variant="primary" onClick={onClose} style={{ marginTop: 20 }}>
          Got it
        </Button>
      </div>
    </div>
  );
}

// ---- Expandable (DESIGN.md §7: 48px row with icon/title/chevron, body padding 16) ----
export function Expandable({ icon: Icon, title, children }: { icon: IconType; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: color.surface, borderRadius: radius.card, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', padding: '0 16px', cursor: 'pointer' }}
      >
        <Icon size={16} color={color.textSecondary} />
        <span style={{ ...typography.bodyMedium, color: color.text, flex: 1, textAlign: 'left' }}>{title}</span>
        <ChevronDown size={16} color={color.textTertiary} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && <div style={{ padding: '0 16px 16px', ...typography.small, color: color.textSecondary }}>{children}</div>}
    </div>
  );
}

// ---- WaveStrip (DESIGN.md §7: filled dots on a muted line, upstream teal / site black / downstream copper) ----
export type WaveNode = { label: string; sub: string; tone: 'teal' | 'text' | 'copper'; you?: boolean };

export function WaveStrip({ nodes }: { nodes: WaveNode[] }) {
  const toneColor: Record<WaveNode['tone'], string> = { teal: color.teal, text: color.text, copper: color.copper };
  return (
    <div style={{ display: 'flex', overflowX: 'auto', gap: space[1] }}>
      {nodes.map((n, i) => (
        <div key={i} style={{ flex: '0 0 auto', minWidth: 84, textAlign: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: radius.dot, background: toneColor[n.tone], margin: '0 auto 6px' }} />
          <div style={{ ...typography.smallMedium, color: n.you ? color.tealDark : color.text }}>{n.label}</div>
          <div style={{ ...typography.small, color: color.textSecondary }}>{n.sub}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `src/components/ui.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui.tsx
git commit -m "feat: add DESIGN.md shared UI component library"
```

---

### Task 3: Global styles & fonts — `src/style.css`

**Files:**
- Modify: `src/style.css` (full replace — the existing Vite-scaffold rules are dead code; `FlowSure.tsx`'s `Shell` never renders `#app`/`.hero`/`#next-steps`/`#docs`/`#spacer`/`.ticks`/`.counter`, only inline styles and the `uf-scroll`/`uf-hc` classes)

**Interfaces:**
- Produces: global Inter Tight + Inter font load, `body` background, and the `uf-scroll`/`uf-hc` utility classes (moved here from the in-component `FONT_STYLES` string in Task 4).

- [ ] **Step 1: Replace the file contents**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: #F5F7FA;
  font-family: 'Inter Tight', sans-serif;
}

.uf-scroll::-webkit-scrollbar {
  display: none;
}

/* high-contrast: darken the muted secondary-text colour specifically,
   rather than touching primary text or coloured badges */
.uf-hc [style*="#525965"] {
  color: #0A0C15 !important;
}
.uf-hc [style*="#717984"] {
  color: #0A0C15 !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat: load Inter Tight/Inter, drop unused Vite scaffold CSS"
```

---

### Task 4: App shell, brand, top bar

**Files:**
- Modify: `src/FlowSure.tsx:1-65` (imports, `FONT_STYLES`)
- Modify: `src/FlowSure.tsx` `Shell`, `Brand`, `TopBar`, `PreviewSwitcher` (component bodies, originally lines 581-901)

**Interfaces:**
- Consumes: `color`, `space`, `radius`, `typography` (Task 1); `Card`, `Pill`, `LevelPill`, `Button` (Task 2).
- Produces: no new exports — internal to `FlowSure.tsx`. Establishes the pattern every later task follows (delete `className="uf-body"/"uf-display"`, replace with `style={{...typography.x}}`).

**IMPORTANT — keep the local `T` token object in place in this task.** Every screen not yet converted (`HomeTab`, `PathTab`, `AlertsTab`, `ReportTab`, `MoreTab`, `WaterGauge`, `Outlook14Day`, `HistoryCard`, `PayoutCard`, `ToggleRow`, `LangPill`, `SettingsRow`, `BottomNav`, `DEMO_LOCATIONS`, `REPORT_OPTIONS`, and more) still references `T.xxx` and is not touched until Tasks 5–12. Deleting `T` now would leave the file in a non-compiling state (`T is not defined`, dozens of occurrences) until Task 12 finishes, which breaks every intermediate task's typecheck signal. Only `FONT_STYLES` is deleted in this task — `T` is deleted later, in Task 12 Step 4, once every consumer has migrated off it.

- [ ] **Step 1: Update imports and delete `FONT_STYLES` (keep `T` for now)**

Old (`FlowSure.tsx:1-65`):
```tsx
import { useState, useMemo } from "react";
import {
  Droplets,
  ...
} from "lucide-react";
import {
  AreaChart,
  ...
} from "recharts";

const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces...
  ...
`;

// ---- design tokens ----
const T = {
  paper: "#EAF2FB",
  ...
};
```

New:
```tsx
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
import { color, space, radius, typography } from "./theme";
import { Pill } from "./components/ui";

// ---- design tokens ----
// Kept temporarily: every screen not yet converted to theme.ts still
// references T.xxx. Deleted in Task 12 Step 4 once all consumers have
// migrated off it (see the note above this step).
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
```

(`FONT_STYLES` is deleted outright — fonts now load from `style.css`, Task 3. `T` is unchanged from the original file — it stays exactly as it was, just moved below the new imports, until Task 12 deletes it.)

- [ ] **Step 2: Replace `Shell`**

Old:
```tsx
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
```

New (flat `brandDark` fill, no gradient; outer shadow kept — it's the demo's phone-frame chrome, not in-flow app UI):
```tsx
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
```

- [ ] **Step 3: Replace `Brand`**

Old:
```tsx
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
```

New (`LogoMark`'s custom SVG is kept for now — swapping in `DESIGN.md`'s actual brand assets, `assets/brand/logo.png`/`logo-mark.png`, needs those files added to the repo first and is not part of this pass; recolour it to the spec's mark colour and set the wordmark text in `teal`, matching `DESIGN.md` §1b's "mark colour #45B6E5"):
```tsx
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
```

Also update `LogoMark`'s default prop (`FlowSure.tsx:606`) from `color = "#1E9CF2"` to `color = color.teal` — rename the parameter to avoid shadowing the imported `color` token:

Old:
```tsx
function LogoMark({ size = 19, color = "#1E9CF2" }) {
```

New:
```tsx
function LogoMark({ size = 19, color: fill = "#45B6E5" }) {
```

...and update the single `fill={color}` reference inside `LogoMark` to `fill={fill}`.

- [ ] **Step 4: Replace `TopBar`**

Old (`FlowSure.tsx:667-750`) used `rgba(255,255,255,0.1)` translucent chips and `T.paper`/`"#A9C6E8"` text on the gradient shell. New version sits on the flat `brandDark` shell and uses `Pill`/`LevelPill` from Task 2:

```tsx
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
          <p style={{ ...typography.small, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
            {timeToImpact(gap, activeLoc, status.key)}
          </p>
        </div>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <RefreshCw size={11} color={fresh.textColor} />
        <span style={{ ...typography.small, color: "rgba(255,255,255,0.6)" }}>{fresh.text}</span>
        {fresh.state === "stale" && (
          <span style={{ ...typography.smallMedium, color: color.warning }}>· data may be delayed</span>
        )}
      </div>

      {(status.key === "watch" || status.key === "act") && loc.shelter && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <Landmark size={16} color={color.white} style={{ flexShrink: 0 }} />
          <div style={{ ...typography.small, color: "rgba(255,255,255,0.85)", lineHeight: 1.3 }}>
            Nearest higher ground: <strong>{loc.shelter.name}</strong> · {loc.shelter.distanceKm} km away
          </div>
        </div>
      )}
    </div>
  );
}
```

This introduces two data-shape changes finished in Task 5: `status` now carries `{ label, key, fill, text }` (a `level` entry) instead of `{ label, key, color }`, and `freshness()` returns `textColor` instead of `color`. Both are updated in Task 5 (`statusForLocation`/`effectiveState`/`freshness`) so this task and Task 5 must land together — see Task 5 Step 1.

- [ ] **Step 5: Replace `PreviewSwitcher`** (demo-only control; keep its function, drop the border-based active/inactive styling)

Old (`FlowSure.tsx:864-901`) used `1.5px solid` borders per chip. New:

```tsx
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
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: only the 3 pre-existing baseline errors recorded in the ledger (`HomeTab`/`PathTab`/`PayoutCard` implicit prop-type mismatches, fixed in Tasks 7/8/11) — no new errors, and specifically no `T is not defined`/`Cannot find name 'T'` errors, since `T` is kept in place this task (see the note above Step 1). If you see `T` reference errors, `T` was deleted by mistake — restore it.

- [ ] **Step 7: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: shell/brand/top bar onto DESIGN.md tokens"
```

---

### Task 5: Status/level data model + onboarding screen

**Files:**
- Modify: `src/FlowSure.tsx` — `statusForLocation`, `PREVIEW_STATES`, `effectiveState`, `freshness` (originally lines 184-234)
- Modify: `src/FlowSure.tsx` — onboarding screen JSX (originally lines 272-440)
- Modify: `src/FlowSure.tsx` — `Feature` (originally lines 635-656)

**Interfaces:**
- Consumes: `color`, `level`, `typography`, `radius`, `space` (Task 1); `Button`, `IconTile`, `Pill` (Task 2). Task 4 left the imports at `import { color, space, radius, typography } from "./theme";` and `import { Pill } from "./components/ui";` (Task 4 itself doesn't use `level`, `Card`, `Button`, `LevelPill`, `Notice`, `Stat`, or `Meter` — see the correctness note below). This task's own code (the status/level helpers plus the onboarding screen) uses `level` (from `theme.ts`) and `Button`/`IconTile` (from `ui.tsx`, alongside the already-imported `Pill`) — add exactly those to the two import lines, nothing more.

**Correctness note that applies to every remaining task in this plan, not just this one:** don't trust an "import X, Y, Z" list written into an earlier task's diff at face value if the code shown for *this* task doesn't visibly call `X`/`Y`/`Z` — `tsconfig.json` has `noUnusedLocals`/`noUnusedParameters` on, so an imported-but-unused symbol is a compile error, not a warning. Before running your typecheck step, scan the code you just wrote for every `theme.ts`/`components/ui.tsx` symbol it actually references, and make the two import lines match that exactly — no more (unused-import errors), no less (`Cannot find name` errors). Treat `tsc`'s output as the authority: if it flags an unused import, remove it; if it flags a missing name, add it to the correct import line.
- Produces: `status` objects now shaped `{ key: LevelKey, label: string, fill: string, text: string }` (matching `theme.ts`'s `level` entries) — consumed by every remaining task.

- [ ] **Step 1: Rewrite the status/level helpers**

Old:
```tsx
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
```

New — status keys now line up with `theme.ts`'s `level` map (`quiet`/`watch`/`act`/`done`; `major` is unused here, reserved for a future "severe" tier):

```tsx
function statusForLocation(loc, currentStage) {
  const gap = loc.trigger - currentStage;
  if (gap <= 0) return { key: "act", label: "Breached — payout processing", ...level.act };
  if (gap <= 0.5) return { key: "watch", label: "Watch closely", ...level.watch };
  return { key: "quiet", label: "Quiet for now", ...level.quiet };
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
```

And `freshness()` (old used `T.green`/`T.amber`/`T.red` and returned `color`):

Old:
```tsx
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
```

New (renamed field to `textColor` to avoid shadowing the `color` token import):
```tsx
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
```

Every other reference to `status.color` in the file (there are several — `StatusPill`, `PathTab`, `AlertsTab`, `PayoutCard`, `MoreTab`) must change to `status.fill`/`status.text` as those screens are converted in later tasks — each later task's diff handles its own occurrences.

- [ ] **Step 2: Rewrite `Feature` as `IconTile` usage in onboarding**

Old (`FlowSure.tsx:635-656`):
```tsx
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
```

Delete `Feature` entirely — the onboarding screen's three-item row switches to the shared `IconTile` component directly (Step 3), since `IconTile` already matches this exact anatomy (44px tinted square + 2-word title + caption) per `DESIGN.md` §7.

- [ ] **Step 3: Rewrite the onboarding screen**

Old (`FlowSure.tsx:273-440`) — full block, replace in its entirety:

```tsx
  if (view === "onboarding") {
    return (
      <Shell textScale={textScale} highContrast={highContrast}>
        <div style={{ padding: "44px 24px 20px" }}>
          <Brand />
          <h1 style={{ ...typography.display, color: color.white, margin: "16px 0 10px" }}>
            Know before the river gets to you.
          </h1>
          <p style={{ ...typography.body, color: "rgba(255,255,255,0.75)", margin: "0 0 22px" }}>
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
            borderRadius: "28px 28px 0 0",
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
```

Note `demoRow` is deleted in Task 12 Step 4 (shared style-constants cleanup) once nothing references it — until then, replace its definition now to drop its border (this task already needs a border-free `demoRow` for the onboarding screen's demo-location list). `FlowSure.tsx` only imports `{ useState, useMemo }` from `"react"` (no `React` namespace/type import), so do NOT annotate this with `React.CSSProperties` — that would fail to compile with "Cannot find namespace 'React'". Leave it untyped, consistent with every other inline style object in this file:

```tsx
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
```
(replace the old `demoRow` constant at the bottom of the file — `FlowSure.tsx:1894-1904` — with this version now, rather than waiting for Task 12).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`

- [ ] **Step 5: Visual QA**

Run: `npm run dev`, open the app, confirm: dark flat panel (no gradient) behind the headline, three teal `IconTile`s, primary green "Set my location" button, no visible border lines anywhere on this screen.

- [ ] **Step 6: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: status/level data model + onboarding screen onto DESIGN.md tokens"
```

---

### Task 6: Confirm screen

**Files:**
- Modify: `src/FlowSure.tsx` — confirm screen JSX (originally lines 443-513)

**Interfaces:**
- Consumes: `color`, `radius`, `typography` (Task 1); `Button`, `Card` (Task 2) — `Card` is not yet in the `./components/ui` import line after Task 5 (which only added `Button, IconTile, Pill`); add it. As with every task from here on, match the two import lines to actual usage in your changed code — don't trust any import list stated in this section at face value if `tsc` disagrees.
- Note: `MapDecor` and the map preview `<div>` background/pin styling are **out of scope** — leave the `background: "linear-gradient(160deg, #1E5FA8..."` map card and `MapDecor` component untouched; only the surrounding chrome (back button, headline, confirmation card, buttons) is in scope.

- [ ] **Step 1: Rewrite the confirm screen's non-map chrome**

Old (`FlowSure.tsx:443-513`):
```tsx
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
```

New — map block (`MapDecor` + pin) is copied through **unchanged** since it's out of scope; everything else moves to tokens:

```tsx
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
          <p style={{ ...typography.body, color: "rgba(255,255,255,0.75)", marginBottom: 18 }}>
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

        <div style={{ background: color.page, borderRadius: "28px 28px 0 0", flex: 1, marginTop: 18, padding: "22px 24px 32px" }}>
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
```

(Also swaps "how much warning we can give you" → "how much notice we can give you" per the §9 copy rule — see Global Constraints.)

`loc.color` (used for the map pin ring) still references the demo-data `color` field on `DEMO_LOCATIONS` items — that's unrelated to the imported `theme.ts` `color` token and is remapped in Task 5's sibling work... actually `DEMO_LOCATIONS` itself is updated in this task, see Step 2.

- [ ] **Step 2: Remap `DEMO_LOCATIONS`'s `color` field**

`DEMO_LOCATIONS` (`FlowSure.tsx:68-117`) sets each location's `color: T.red`/`T.amber`/`T.green` — these drove the map pin ring colour and the onboarding demo-list dot. Update:

Old:
```tsx
    color: T.red,
```
```tsx
    color: T.amber,
```
```tsx
    color: T.green,
```

New (matching each location's implied severity tier to the `level` semantic set):
```tsx
    color: level.act.fill,
```
```tsx
    color: level.watch.fill,
```
```tsx
    color: level.quiet.fill,
```

- [ ] **Step 3: Typecheck + visual QA**

Run: `npx tsc --noEmit -p tsconfig.json`, then `npm run dev` and step through Onboarding → "Set my location" → Confirm screen. Confirm: no visible border on the confirmation card, primary/secondary buttons match Task 4/5's button styling, map block is visually unchanged from before this task.

- [ ] **Step 4: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: confirm screen chrome onto DESIGN.md tokens (map untouched)"
```

---

### Task 7: Home tab — gauge, chart, outlook, history

**Files:**
- Modify: `src/FlowSure.tsx` — `WaterGauge`, `LegendRow`, `Outlook14Day`, `HistoryCard`, `HomeTab` (originally lines 773-999)

**Interfaces:**
- Consumes: `color`, `radius`, `typography`, `space` (Task 1); `Card`, `Meter` (Task 2).
- Produces: `HomeTab` now renders `Meter` instead of the bespoke vertical-tank `WaterGauge`/`LegendRow` pair — this is a direct application of the DESIGN.md §7 `Meter` spec ("the bar is full at the trigger"), replacing a component that has no equivalent in `DESIGN.md`.

- [ ] **Step 1: Delete `WaterGauge` and `LegendRow`, replace their call site with `Meter`**

Delete the `WaterGauge` function (`FlowSure.tsx:773-818`) and `LegendRow` function (`FlowSure.tsx:820-828`) entirely.

- [ ] **Step 2: Rewrite `Outlook14Day`**

Old (`FlowSure.tsx:830-862`):
```tsx
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
```

New:
```tsx
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
```

- [ ] **Step 3: Rewrite `HistoryCard`**

Old (`FlowSure.tsx:903-922`) had `background: "#fff", border: "1px solid #DCE7F5"`. New:

```tsx
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
```

- [ ] **Step 4: Rewrite `HomeTab`**

Old (`FlowSure.tsx:924-999`):
```tsx
function HomeTab({ loc, gap, onSeePath, previewMode, setPreviewMode }) {
  const [range, setRange] = useState("7d");
  const data = range === "7d" ? STAGE_HISTORY : STAGE_HISTORY_30D;
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

      <button onClick={onSeePath} style={btnGhost}>
        <Route size={16} />
        See the water's path to you
      </button>
    </div>
  );
}
```

New — `WaterGauge` becomes `Meter`; the chart keeps a flat fill instead of the `linearGradient` def (per Global Constraints, no gradients even in SVG code) using a flat `color.tealSurface` at partial opacity instead:

```tsx
function HomeTab({ loc, gap, onSeePath, previewMode, setPreviewMode }) {
  const [range, setRange] = useState("7d");
  const data = range === "7d" ? STAGE_HISTORY : STAGE_HISTORY_30D;
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
```

- [ ] **Step 5: Typecheck + visual QA**

Run: `npx tsc --noEmit -p tsconfig.json`, then `npm run dev`, navigate to the Home tab across all `PreviewSwitcher` states (Live/Safe/Watch/Breach/Paid) and confirm the meter bar colour changes (green/orange/red) as gap narrows, no borders visible, chart area fill is flat (inspect via devtools — no `<linearGradient>` element in the rendered SVG).

- [ ] **Step 6: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: home tab onto Meter/Card, remove gauge/chart gradients"
```

---

### Task 8: Path tab

**Files:**
- Modify: `src/FlowSure.tsx` — `PathTab` (originally lines 1001-1151)

**Interfaces:**
- Consumes: `color`, `radius`, `typography`, `space` (Task 1); `Card`, `WaveStrip` (Task 2).
- Copy fix: checkpoint category label `"Early warning"` → `"Early watch"` (Global Constraints §9 — no "warning"/"alert" in user-facing copy).

- [ ] **Step 1: Rewrite `PathTab`**

Old (`FlowSure.tsx:1001-1151`) — full function. Key structural changes: drop all `border:`/`"#fff"`/hex literals for tokens; replace the manual upstream-node row with `WaveStrip`; replace `"Early warning"` with `"Early watch"`; drop `fontStyle: "italic"` (not part of the type system) in favor of `typography.small`.

```tsx
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
```

- [ ] **Step 2: Typecheck + visual QA**

Run: `npx tsc --noEmit -p tsconfig.json`, then check the Path tab across all preview states — confirm the progress bar/step dots recolor correctly and the upstream row renders via `WaveStrip` with teal dots + a highlighted "Your place" node.

- [ ] **Step 3: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: path tab onto DESIGN.md tokens, fix 'early warning' copy"
```

---

### Task 9: Alerts → Updates tab

**Files:**
- Modify: `src/FlowSure.tsx` — `AlertsTab` (originally lines 1153-1245)

**Interfaces:**
- Consumes: `color`, `radius`, `typography` (Task 1); `Card`, `Notice` (Task 2).
- Copy fix: the tab's on-screen heading changes from "Alerts" to "Updates" (§9 rule). The `tab` state key (`"alerts"`) and prop names stay as-is — those are internal identifiers, not rendered copy, so renaming them is unnecessary churn.

- [ ] **Step 1: Rewrite `AlertsTab`**

Old (`FlowSure.tsx:1153-1245`) — full function:

```tsx
function AlertsTab({ loc, progressIndex, paid }) {
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
            <Card key={i} tint={isTrigger ? undefined : undefined} style={{ marginBottom: 0 }}>
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
```

(`tint={isTrigger ? undefined : undefined}` collapses to no-op — write it as plain `<Card key={i} style={{ marginBottom: 0 }}>` instead; left here only to flag that a per-event tint was considered and rejected: rule 4 caps a card at *one* accent, already spent on the overline label, so the card body stays a plain white surface regardless of event type.)

- [ ] **Step 2: Update `BottomNav`'s label for this tab** (see Task 12 Step 2 for the full `BottomNav` rewrite — this step is a pointer, not a duplicate edit)

The nav item `{ key: "alerts", label: "Alerts", icon: Bell }` becomes `{ key: "alerts", label: "Updates", icon: Bell }` in Task 12.

- [ ] **Step 3: Typecheck + visual QA**

Run: `npx tsc --noEmit -p tsconfig.json`, then check this tab in a state with `progressIndex > 0` (e.g. Watch or Breach preview) — confirm cards render without borders and the heading reads "Updates".

- [ ] **Step 4: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: alerts tab onto DESIGN.md tokens, rename to Updates"
```

---

### Task 10: Report tab

**Files:**
- Modify: `src/FlowSure.tsx` — `NearbyReports`, `ReportTab` (originally lines 1247-1357)
- Modify: `src/FlowSure.tsx` — `REPORT_OPTIONS` (originally lines 172-177)

**Interfaces:**
- Consumes: `color`, `radius`, `typography` (Task 1); `Card`, `Button`, `Notice`, `SeverityTile` (Task 2).

- [ ] **Step 1: Remap `REPORT_OPTIONS`' colours**

Old (`FlowSure.tsx:172-177`):
```tsx
const REPORT_OPTIONS = [
  { id: "clear", label: "All clear here", color: T.green },
  { id: "road", label: "Water on the road", color: T.amber },
  { id: "compound", label: "Water in my compound", color: T.amber },
  { id: "house", label: "Water in my house", color: T.red },
];
```

New:
```tsx
const REPORT_OPTIONS = [
  { id: "clear", label: "All clear here", icon: Check, tone: level.quiet.fill },
  { id: "road", label: "Water on the road", icon: Route, tone: level.watch.fill },
  { id: "compound", label: "Water in my compound", icon: Home, tone: level.watch.fill },
  { id: "house", label: "Water in my house", icon: Landmark, tone: level.act.fill },
];
```

- [ ] **Step 2: Rewrite `ReportTab`'s option list as `SeverityTile`s**

Old (`FlowSure.tsx:1282-1330`) rendered full-width bordered rows. New — a wrapping grid of `SeverityTile`, matching `DESIGN.md` §7's "84px tile, icon + 2 words, selected = tealDark fill":

```tsx
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
```

- [ ] **Step 3: Rewrite `NearbyReports`**

Old (`FlowSure.tsx:1247-1280`) used bordered rows and `T.riverLight`. New:

```tsx
function NearbyReports({ loc }) {
  const byTier = {
    near: [
      { who: "Neighbour, Riverside Ward", what: "Water on the road near the bridge", when: "18 min ago" },
      { who: "Neighbour, Riverside Ward", what: "All clear at the market", when: "1h ago" },
    ],
    mid: [{ who: "Neighbour, Bula", what: "All clear here", when: "40 min ago" }],
    far: [{ who: "Neighbour, Iftin", what: "All clear here", when: "2h ago" }],
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
```

(Wrap consecutive `<Card>`s with `gap: 8` on the parent flex container rather than each card's own `marginBottom` — set `marginBottom: 0` on each to avoid doubled spacing, as done above and in Task 9.)

- [ ] **Step 4: Typecheck + visual QA**

Run: `npx tsc --noEmit -p tsconfig.json`, then open the Report tab, tap each severity tile and confirm the selected one fills `tealDark` with a white icon/label, the "thanks" notice appears, and the nearby-reports list renders without borders.

- [ ] **Step 5: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: report tab onto SeverityTile/Card, remove bordered rows"
```

---

### Task 11: More tab — locations, payout, share contacts

**Files:**
- Modify: `src/FlowSure.tsx` — `MoreTab` (locations list + share-contacts sections only, originally lines 1400-1536), `PayoutCard` (originally lines 1633-1682), `StatusPill` (originally lines 752-771), `SectionLabel` (originally lines 1684-1690)

**Interfaces:**
- Consumes: `color`, `radius`, `typography`, `space` (Task 1); `Card`, `LevelPill`, `Button`, `IconTile` (Task 2).
- Produces: `StatusPill` is replaced outright by `LevelPill` (Task 2) at every call site — delete `StatusPill` once all 3 call sites (`MoreTab`'s location list, `PayoutCard`) are converted.

- [ ] **Step 1: Delete `StatusPill`, rewrite `SectionLabel`**

Delete the `StatusPill` function (`FlowSure.tsx:752-771`) — replaced by `LevelPill` from `ui.tsx` everywhere it was used.

Old `SectionLabel` (`FlowSure.tsx:1684-1690`):
```tsx
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 600, letterSpacing: 0.3, marginBottom: 10 }}>
      {children.toString().toUpperCase()}
    </div>
  );
}
```

New (uses the `overline` type role, which is already uppercase per its spec):
```tsx
function SectionLabel({ children }) {
  return <div style={{ ...typography.overline, color: color.textTertiary, marginBottom: 10 }}>{children}</div>;
}
```

- [ ] **Step 2: Rewrite `PayoutCard`**

Old (`FlowSure.tsx:1633-1682`) used bordered cards and `StatusPill`. New:

```tsx
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
```

- [ ] **Step 3: Rewrite `MoreTab`'s locations list + share-contacts block**

Old (`FlowSure.tsx:1400-1536`) — replace the JSX from the `<h3>My properties</h3>` heading through the end of the share-contacts `<div>` (just before `<SectionLabel>Notifications</SectionLabel>`):

```tsx
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
      <PayoutCard loc={activeLoc} status={activeStatus} gap={activeGap} paid={activePaid} />

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
```

(Note: `SectionLabel` is invoked as `<SectionLabel>Payout history</SectionLabel>` — plain text children, not the old `.toString().toUpperCase()` pattern, since `typography.overline` already sets `textTransform: 'uppercase'`.)

- [ ] **Step 4: Typecheck + visual QA**

Run: `npx tsc --noEmit -p tsconfig.json`, then open More, confirm the active location card is teal-tinted with no border, `LevelPill` shows the correct level colour per location, and the payout card only renders content for act/done states.

- [ ] **Step 5: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: more tab locations/payout/contacts onto DESIGN.md tokens"
```

---

### Task 12: More tab — settings sections + bottom nav

**Files:**
- Modify: `src/FlowSure.tsx` — `ToggleRow`, `LangPill`, `SettingsRow`, `BottomNav` (originally lines 1692-1859), and `MoreTab`'s remaining sections (notifications/multi-location/language/accessibility/data, originally lines 1537-1629)
- Modify: `src/FlowSure.tsx` — delete `btnPrimary`, `btnGhost`, `demoRow` (already replaced in Task 5), `changeBtn` (already inlined in Task 11), `iconBtn` (already inlined in Task 6) style constants (originally lines 1861-1927)

**Interfaces:**
- Consumes: `color`, `radius`, `typography`, `space` (Task 1).
- Produces: no remaining references to the deleted style constants anywhere in the file — this task's typecheck step is the final confirmation of that.

- [ ] **Step 1: Rewrite `ToggleRow`, `LangPill`, `SettingsRow`**

Old `ToggleRow` (`FlowSure.tsx:1692-1741`) used `background: "#fff", border: "1px solid #DCE7F5"`. New:

```tsx
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
```

(Drops the switch knob's `boxShadow` — per Global Constraints, shadows are reserved for floating overlays only.)

Old `LangPill` (`FlowSure.tsx:1743-1773`):
```tsx
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
```

Old `SettingsRow` (`FlowSure.tsx:1775-1809`):
```tsx
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
```

- [ ] **Step 2: Rewrite `BottomNav`**

Old (`FlowSure.tsx:1811-1859`) had `background: "#fff", borderTop: "1px solid #DCE7F5"` and label "Alerts". New:

```tsx
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
```

(The white nav-vs-page separation now relies on ground contrast alone — `surface` #FFFFFF sitting on the tab content's `page` #F5F7FA background above it — per rule 3.)

- [ ] **Step 3: Rewrite `MoreTab`'s remaining sections**

Old (`FlowSure.tsx:1537-1629`) — replace from `<SectionLabel>Notifications</SectionLabel>` through the end of the function:

```tsx
      <SectionLabel>Notifications</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <ToggleRow icon={Bell} label="App notifications" sub="When the watch changes — once a day at most" on={pushOn} onChange={() => setPushOn((v) => !v)} />
        <ToggleRow icon={Route} label="SMS backup" sub="For days when your data is off or the network is slow" on={smsOn} onChange={() => setSmsOn((v) => !v)} />
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
        <ToggleRow icon={Type} label="Larger text" sub="Makes everything on screen a bit bigger" on={textScale === "large"} onChange={() => setTextScale((v) => (v === "large" ? "normal" : "large"))} />
        <ToggleRow icon={Contrast} label="Higher contrast" sub="Darker text, easier to read in bright sun" on={highContrast} onChange={() => setHighContrast((v) => !v)} />
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
```

- [ ] **Step 4: Delete the dead shared-style constants and the local `T` token object**

Delete `btnPrimary`, `btnGhost`, `demoRow`, `changeBtn`, `iconBtn` (`FlowSure.tsx:1861-1927` in the original file) — by this point every call site has been converted to `Button`/inline token styles in Tasks 4–12, so nothing references them.

Also delete the local `T` token object that Task 4 deliberately kept in place (see Task 4's note above its Step 1) as a bridge while screens were converted one at a time. By this point Tasks 4–11 have converted every consumer (`Shell`/`Brand`/`TopBar`/`PreviewSwitcher`, onboarding, confirm, `DEMO_LOCATIONS`, `HomeTab`/`WaterGauge`/`Outlook14Day`/`HistoryCard`, `PathTab`, `AlertsTab`, `ReportTab`/`REPORT_OPTIONS`/`NearbyReports`, `MoreTab`'s locations/payout/contacts sections, `PayoutCard`, `StatusPill` deletion, `SectionLabel`), and this task's own Steps 1–3 convert the last remaining consumers (`ToggleRow`, `LangPill`, `SettingsRow`, `BottomNav`, `MoreTab`'s notifications/multi-location/language/accessibility/data sections). Before deleting `T`, run `grep -n '\bT\.' src/FlowSure.tsx` — expect zero matches; if any remain, convert that call site to the equivalent `theme.ts` token first (cross-reference the mapping table in Task 5 Step 1's commentary: `T.river`→`color.tealDark` for links/accents or `color.green` for primary actions per context, `T.ink`→`color.text`, `T.inkSoft`→`color.textSecondary`, `T.red`/`T.amber`/`T.green`→`level.act.fill`/`level.watch.fill`/`level.quiet.fill`, etc.) rather than deleting `T` while something still depends on it.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: **zero errors.** `noUnusedLocals`/`noUnusedParameters` (`tsconfig.json`) will now also flag any leftover unused import (e.g. `Divider`, `Stat` from `ui.tsx` if never called) — either use them or remove them from the Task 4 import line. This is also the first point in the plan where the file is expected to compile with zero errors — earlier tasks' "baseline" errors (recorded in the ledger) are fully resolved by this point, since Tasks 7/8/11 fixed the `HomeTab`/`PathTab`/`PayoutCard` prop-type mismatches along the way.

- [ ] **Step 6: Commit**

```bash
git add src/FlowSure.tsx
git commit -m "refactor: settings sections + bottom nav onto DESIGN.md tokens, delete dead style constants"
```

---

### Task 13: Full-file sweep and final verification

**Files:**
- Modify: `src/FlowSure.tsx` (spot-fixes only, if the sweep below finds stragglers)

**Interfaces:**
- None — this is a verification-only task confirming Tasks 1–12 left no gaps.

- [ ] **Step 1: Grep for banned patterns**

Run:
```bash
grep -n "gradient" src/FlowSure.tsx src/components/ui.tsx src/style.css
```
Expected: no matches (the one intentional exception, the out-of-scope map card's `linear-gradient` in the Confirm screen, Task 6, is acceptable — confirm any match is exactly that line and nothing else).

Run:
```bash
grep -n '\bT\.' src/FlowSure.tsx
grep -n '^const T = {' src/FlowSure.tsx
```
Expected: no matches for either — the local `T` token object (kept temporarily by Task 4, deleted in Task 12 Step 4) should have zero remaining references and zero remaining definition by this point.

Run:
```bash
grep -n "border:" src/FlowSure.tsx src/components/ui.tsx
```
Expected: no matches other than `border: "none"` (explicitly clearing a native `<button>`/`<input>` default) — any `border: "1px solid ...">`-style match is a straggler to fix.

Run:
```bash
grep -n '"#[0-9A-Fa-f]\{6\}"' src/FlowSure.tsx
```
Expected: no matches — every colour should route through `color`/`level` from `theme.ts`. (The `DEMO_LOCATIONS`/chart/SVG data literals are the likely remaining hits if Task 6 Step 2 or Task 7 was skipped — fix by importing the matching token.)

Run:
```bash
grep -n "uf-body\|uf-display\|className=\"uf-" src/FlowSure.tsx
```
Expected: no matches — every text element should carry its typography via inline `style={{...typography.x}}` instead.

Run:
```bash
grep -ni '"[^"]*\b(warning|alert)\b[^"]*"' src/FlowSure.tsx
```
Expected: no user-facing string literals containing "warning" or "alert" (case-insensitive) other than internal identifiers like the `"alerts"` tab key — inspect each match by hand and fix any that's rendered copy.

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit code 0, no output.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds (this also re-runs `tsc` per the `package.json` `build` script, then Vite bundles).

- [ ] **Step 4: Full visual QA pass**

Run: `npm run dev`, then walk every screen and every `PreviewSwitcher` state:
- Onboarding → demo list expand/collapse → Confirm → each tab (Watch/Path/Updates/Report/More) in Live, Safe, Watch, Breach, and Paid preview states.
- Confirm: no visible border lines anywhere except the (out-of-scope) map card; no gradients except that same map card; all card radii look consistent (12px); all buttons are either solid green (primary) or solid muted (secondary); the bottom nav's active tab is teal, inactive tabs are `textSecondary` grey; the Path tab's progress bar and step dots recolor correctly per state; the Report tab's severity tiles are 84px squares that fill teal when selected; toggle switches have no shadow.

- [ ] **Step 5: Commit** (only if Step 1 found and fixed stragglers)

```bash
git add src/FlowSure.tsx
git commit -m "fix: remaining DESIGN.md compliance stragglers from full-file sweep"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (flat colour, no borders, one accent/surface) → Tasks 4–13 throughout. §1b (brand) → Task 4 Step 3 (flagged: full asset swap needs the actual `logo.png`/`logo-mark.png` files, out of scope until provided). §2 (colour) → Task 1 + Task 5 Step 1 (status/level model) + Task 6 Step 2 (`DEMO_LOCATIONS`) + Task 10 Step 1 (`REPORT_OPTIONS`). §3 (grounds) → `Card` tints, Task 2. §4 (spacing/radius/shadow) → `theme.ts` + every screen task. §5 (typography) → Task 3 (fonts) + `typography` token used throughout. §6 (spacing scale) → `space` array, applied in `Card`/`Button`. §7 (components) → Task 2 builds the full table; §8 (map) → explicitly out of scope. §9 (copy) → Task 6 Step 1 ("warning"→"notice"), Task 8 Step 1 ("Early warning"→"Early watch"), Task 9 ("Alerts"→"Updates"), verified in Task 13 Step 1.
- **Placeholder scan:** no "TBD"/"similar to"/"add error handling" — every task gives full replacement code or an exact line-anchored instruction (delete X, rename field Y→Z).
- **Type consistency:** `status` shape `{ key, label, fill, text }` introduced in Task 5 Step 1 is used identically in Task 4 Step 4 (`TopBar`), Task 8 (`PathTab`), Task 9 (`AlertsTab`), Task 11 (`PayoutCard`, `MoreTab`) — all read `.key`/`.fill`/`.text`, never the old `.color`. `freshness()`'s renamed `textColor` field (Task 5) matches its one call site in Task 4 Step 4.
