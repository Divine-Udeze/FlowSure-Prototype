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
  scrim: 'rgba(10, 12, 21, 0.4)',
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
  statCompact: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 600, fontSize: 14, lineHeight: '20px', letterSpacing: -0.4 },
  body: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: -0.2 },
  bodyMedium: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 500, fontSize: 14, lineHeight: '20px', letterSpacing: -0.2 },
  small: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 400, fontSize: 12, lineHeight: '16px', letterSpacing: 0 },
  smallMedium: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 500, fontSize: 12, lineHeight: '16px', letterSpacing: 0 },
  overline: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 500, fontSize: 11, lineHeight: '16px', letterSpacing: 1.2, textTransform: 'uppercase' as const },
  chartLabel: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 400, fontSize: 10, lineHeight: '12px', letterSpacing: 0 },
} as const;
