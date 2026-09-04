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
        <span style={{ ...typography.statCompact, color: color.text }}>
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
      <div style={{ ...typography.smallMedium, color: color.white }}>{title}</div>
      <div style={{ ...typography.small, color: color.teal, marginTop: 2 }}>{caption}</div>
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
      style={{ position: 'absolute', inset: 0, background: color.scrim, display: 'flex', alignItems: 'flex-end', zIndex: 20 }}
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
