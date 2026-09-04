# Agrails Design Specification, mobile edition

Mobile version of `urbanflow/DESIGN.md` for the Agrails Flood Watch app. Tokens are in `src/theme.ts`,
components in `src/components/ui.tsx`. Where this file and the platform differ, the platform's
`--color-*` variables and tailwind `backgroundImage` set are the source; this file adds the mobile
rules (gradients, borders, map) that the desktop spec left implicit.

## 1. Principles

1. **Visual over text.** A main screen answers one question with a number, an icon, a meter, a
   timeline or a pill. One short line of copy per card. Explanations go behind a `(?)` (definitions)
   or an `Expandable` (evidence); legal and attribution text lives in Settings > About.
2. **Flat colour only.** No `linear-gradient` or `radial-gradient` anywhere: styles, code or visual
   descriptions. Every surface is one solid colour.
3. **No borders.** No visible border lines, strokes or outline rules separate containers, cards or
   sections. Separation comes entirely from whitespace (padding, margins) and from subtle ground
   contrast: a white card on the off-white page, a muted inset inside a white card, a tinted block
   inside a card.
4. **One accent per surface.** A card carries at most one accent colour (its overline or its meter);
   the semantic set (success / warning / error) is reserved for state and never used as decoration.
5. **Data marks are data.** Chart lines, the dashed trigger line, map outlines and legend swatches
   are drawn strokes and are exempt from rule 3; they still use only the tokens.

## 1b. Brand

`assets/brand/logo.png` (wordmark, 801 x 191) and `assets/brand/logo-mark.png` (mark, 360 x 324) are
the platform's files, unchanged. Mark colour #45B6E5 (`teal`), wordmark text #0B2514 (primary-700).

- The wordmark goes on light surfaces only (`page`, `surface`), at 26 px high on screens and 220 px
  wide on the splash; the product name sits beside it as a teal pill ("Flood Watch"), never inside it.
- The mark alone at small sizes: 22 px in the top bar (`BrandMark`), the app icon (on white), the
  Android adaptive icon (white ground, mark in the safe zone) and the monochrome icon.
- Never recolour, outline or place either file on the dark panel; the dark panel carries type
  only. Clear space around the mark is half its height.

## 2. Colour

Platform scale (from `src/styles` `--color-*`). Tokens in `color` in `src/theme.ts`.

| Role | Token | Hex | Notes |
|---|---|---|---|
| Page | `page` | #F5F7FA | neutral-50 |
| Surface / alt | `surface` / `surfaceAlt` | #FFFFFF / #F9FAFB | cards / inset areas |
| Mint / mint deep | `mint` / `mintDeep` | #F4FBF9 / #EDF8F9 | primary-50 / 100, tinted cards and pills |
| Teal surface / soft | `tealSurface` / `tealSurfaceSoft` | #ECF8FC / #F3FBFF | blue-50 / 25 |
| Brand dark / deep | `brandDark` / `brandDeep` | #061C1D / #004B50 | dark panels only |
| Text 1 / 2 / 3 | `text` / `textSecondary` / `textTertiary` | #0A0C15 / #525965 / #717984 | neutral-950 / 600 / 500 |
| Placeholder | `placeholder` | #909CAD | neutral-400 |
| Green / green text | `green` / `greenText` | #174B29 / #107138 | primary action; text on mint |
| Teal / teal dark / deep | `teal` / `tealDark` / `tealDeep` | #45B6E5 / #3792B7 / #296D89 | blue-500 / 600 / 700; active tab is `tealDark` |
| Copper / text / surface / border | `copper` / `copperText` / `copperSurface` / `copperBorder` | #A7553F / #753B2C / #F6EEEC / #CC9C90 | rich-soil: downstream, demo, report accents |
| Success | `success` / `successText` / `successSurface` / `successBorder` | #38C793 / #107138 / #EDF9F4 / #9DE4CB | level quiet |
| Warning | `warning` / `warningText` / `warningSurface` / `warningBorder` | #FA8C16 / #B57B00 / #FEF3EB / #FBD5AE | level watch |
| Error | `error` / `errorDark` / `errorSurface` / `errorBorder` | #DF1C41 / #AF1D38 / #FDEDF0 / #F8C9D2 | level act / major |
| Neutral fills (never lines) | `border` / `borderSubtle` / `borderStrong` / `borderInput` | #E8EDF3 / #E1E4E9 / #D7DBE2 / #CACAD4 | neutral-100 / gray-sub / neutral-200 / 300; legacy names, used only as flat fills in the basemap |

Level mapping: quiet = success, watch = warning, act = error, major = error dark with white text.

Rules
- Text on a tinted surface uses the matching `*Text` token (`greenText` on mint, `copperText` on
  copper surface), never the base hue: base hues fail contrast on their own tints.
- Grey text is `textSecondary` for labels and `textTertiary` for captions; no other greys.
- Data marks (charts, map) keep their own palette (`mapStyle`, chart colours): teal for upstream and
  ECMWF, green for observed, copper for downstream, semantic red only for "over the trigger".

## 3. Grounds (instead of gradients)

Layers of flat colour do the work gradients used to do. From back to front:

| Ground | Token | Hex | Used for |
|---|---|---|---|
| Page | `page` | #F5F7FA | the screen |
| Surface | `surface` | #FFFFFF | cards, top bar, tab bar, sheets |
| Surface alt | `surfaceAlt` | #F9FAFB | stat tiles inside a white card |
| Surface muted | `surfaceMuted` | #EEF2F6 | inputs, chips, meter tracks, secondary buttons, notices, handle |
| Tints | `mint`, `tealSurface`, `copperSurface`, level surfaces | | tinted cards, icon squares, pills, the hero |
| Dark panel | `brandDark` | #061C1D | the one dark panel per flow (welcome headline), white type |

Rules
- A surface sits on a ground one step lighter or darker, never the same colour (white on white
  needs a line; we do not draw lines).
- Nested three deep at most: page > card > inset.
- Text on a tint uses the matching `*Text` token; text on the dark panel is white or `teal`.

## 4. Spacing, radius, shadows

- Between cards: 12 px of page. Inside cards: 16 px padding; 10-12 px between rows. Sections inside
  a card are separated by 16-24 px of space (`Divider` renders space, not a line).
- Key-value rows and lists use 10 px of vertical padding between rows and no rules.
- Radius: 6 (inputs), 8 (notices), 10 (buttons), 12 (cards, tiles, hero), 16 (sheets, panel),
  48 (pills), 999 (dots).
- Shadows: one, `shadow.overlay`, only on things that float above content (the help sheet, the two
  cards over the map). In-flow layout never casts a shadow.
- Focus and selection are colour changes (`tealDark` fill on a selected chip or tile), not rings.

## 5. Typography

Inter Tight for UI, Inter for headings (the platform pairing), loaded with `expo-font`.

| Role | Font | Size / line | Tracking | Where |
|---|---|---|---|---|
| Display | Inter Tight Bold | 32 / 38 | -1.3 | welcome headline |
| Card title | Inter Tight Bold | 24 / 32 | -0.8 | hero level word and hero number |
| Page title | Inter Medium | 20 / 28 | -0.4 | header title |
| Section title | Inter Medium | 16 / 24 | -0.3 | sheet titles |
| Stat | Inter Tight SemiBold | 20 / 24 | -0.8 | stat tiles, meter values |
| Body / body medium | Inter Tight 400 / 500 | 14 / 20 | -0.2 | labels, buttons |
| Small / small medium | Inter Tight 400 / 500 | 12 / 16 | 0 | captions, pills |
| Overline | Inter Tight Medium | 11 / 16 | +1.2, uppercase | card headers |
| Chart label | Inter Tight 400 | 10 / 12 | 0 | axes, legends |

Numbers that line up use `fontVariant: ['tabular-nums']`.

## 6. Spacing

4, 8, 10, 12, 14, 16, 20, 24, 32, 48 (`space[1..10]`). Screen padding 12, card padding 16, gaps
between cards 12, inside cards 10-12. Tap targets 44 px minimum even when the glyph is 16 px.

## 7. Components

| Component | Anatomy | Rules |
|---|---|---|
| `Hero` | flat level surface, 40 px icon square in the level's dot colour, level word (card title), one line, big number + label | one per screen; the number is the answer |
| `Card` | white (or tinted) surface on the page, radius 12, padding 16; `tint` = mint / teal / alt / muted | one overline per card |
| `Stat` | `surfaceAlt` tile inside a card; value 20 px, unit 12 px, label 12 px with a 6 px tone dot | three per row maximum |
| `Meter` | label + icon, `value / max unit`, 8 px track, fill green < 50%, orange < 100%, red >= 100% | the bar is full at the trigger |
| `WaterGauge` | vertical tank, home icon at top, flat fill on a fixed 3.8-6.6 m scale, red trigger line, two `LegendRow`s | used for the home-screen "right now" gauge |
| `Pill` | 24 or 32 px, radius 48, tone-tinted fill, optional dot | one word or a number |
| `LevelPill` | pill in the level's tone | header and secondary areas |
| `WaveStrip` | filled dots on a muted line: upstream teal, site black, downstream copper; name + hours, "you" badge | 84 px per node, horizontal scroll |
| `IconTile` | 44 px tinted icon square, 2-word title, 3-word caption | four per row on welcome |
| `SeverityTile` | 84 px tile, icon + 2 words, selected = `tealDark` fill | choice of three |
| `HelpDot` | 16 px circled "?" in `textTertiary`, 44 px hit area, opens `HelpSheet` | six per screen maximum, on domain terms only |
| `HelpSheet` | bottom sheet over a dimmed backdrop, radius 16, muted handle, section title, 1-3 short sentences, "Got it" | text from `src/copy/help.ts` |
| `Expandable` | 48 px row with icon, title, chevron; body padding 16 | evidence and sources |
| `Button` | primary green, 48 px, radius 10; secondary `surfaceMuted`; danger `errorSurface` | one primary per screen |
| `Notice` | tinted block, small text in the tint's text colour | one line |
| `TopBar` | 64 px white on the page, brand mark, title + crumb, right slot | right slot is a pill or a secondary button |
| Tabs | 64 px, `tealDark` active, `textSecondary` inactive, Ionicons outline / filled | four tabs |

## 8. Map

MapLibre (`@maplibre/maplibre-react-native`) with the CARTO Positron vector basemap recoloured to the
Agrails tokens: `src/map/agrails-positron.json` (ground `page`, land `mintDeep` wash, water
`tealBorder`, roads white with `borderSubtle` casings, buildings `border`, boundaries `borderInput`,
labels `textSecondary` / `textTertiary` with a white halo, water labels `tealDark`). Tiles, glyphs and
sprite are CARTO's (free with attribution, same basemap as the web app); no keys.

Layers, in draw order, all under the basemap's label block except the two dots:

| Layer | Source | Style |
|---|---|---|
| City boxes | `boxes` | fill `green` 5%, line `green` 1.2 px dashed 3/2 |
| Catchments | `catchments` | fill `tealDark` 6%, line `tealDark` 1.2 px |
| River above the site | `rivers` (`dir = up`) | line `tealDark`, 1.6 px at z5 to 5 px at z13, round caps |
| River below the site | `rivers` (`dir = down`) | line `copper`, same widths |
| Sites | `sites` | 6 px white circle with a 2.5 px `tealDeep` ring; label from z6, 11 px, white halo |
| Your pin | `pin` | 14 px `green` halo at 15% + 7 px `green` dot with a white ring |

Regions are used for point-in-polygon resolution only and are never drawn. Floating cards: `elevated`
shadow, 12 px inset; legend as three line swatches. Attribution bottom-left, logo and compass off.

## 9. Copy

Watch / trigger / exceedance / chance, never warning or alert. ECMWF and GloFAS are named as inputs.
The standing notice (KMSA) is one collapsed row on Welcome and Settings. Numbers before words: "34 mm
expected on 08-27, trigger 30", not "the forecast exceeds the threshold".
