---
name: Dispose — Design System
colors:
  background: '#0f1512'
  surface: '#161d19'
  surface-dim: '#0f1512'
  surface-bright: '#2a3530'
  surface-container-lowest: '#0a0f0d'
  surface-container-low: '#171e1a'
  surface-container: '#1c2420'
  surface-container-high: '#262e29'
  surface-container-highest: '#313a35'
  on-surface: '#dde4de'
  on-surface-variant: '#bdc9be'
  outline: '#87938a'
  outline-variant: '#3d4a42'
  primary: '#72be8a'
  on-primary: '#003919'
  primary-container: '#00522a'
  on-primary-container: '#4da873'
  secondary: '#5bb8d4'
  on-secondary: '#003543'
  secondary-container: '#004d60'
  on-secondary-container: '#4aa8c4'
  tertiary: '#f4a942'
  on-tertiary: '#3e2200'
  tertiary-container: '#5a3300'
  on-tertiary-container: '#dc9530'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  waste-organic: '#72be8a'
  waste-recycle: '#5bb8d4'
  waste-glass: '#9b8ddb'
  waste-special: '#f4a942'
  waste-pruning: '#a0845a'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: '-0.02em'
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: '-0.01em'
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: '0.08em'
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
---

## Brand & Style

Dispose uses a **Clean Urban Eco** aesthetic — functional, legible, and grounded. The personality is civic and trustworthy, like a well-designed public service app. It avoids greenwashing clichés; the visual language is precise and data-forward, not decorative.

The dominant dark-green surface palette evokes urban parks and recycling infrastructure. Color is used semantically: each waste type has a dedicated accent so users can scan schedules at a glance without reading labels.

## Colors

Base surfaces use deep forest-green-tinted darks. Primary green (`#72be8a`) anchors interactive elements. Waste types each get a fixed semantic color:

| Type | Color | Hex |
|---|---|---|
| Orgânico | Green | `#72be8a` |
| Reciclável | Cyan | `#5bb8d4` |
| Vidro | Violet | `#9b8ddb` |
| Especial (pilhas/eletrônicos) | Amber | `#f4a942` |
| Poda/Entulho | Brown | `#a0845a` |

These colors must remain consistent across schedule cards, badges, map pins, and reminder chips. Never reuse them for other UI purposes.

## Typography

Single font family: **Inter** for all UI. **JetBrains Mono** only for: session IDs, coordinates, API responses in developer views.

Headers use tight negative tracking. Body copy uses standard tracking. Labels use wide positive tracking (uppercase). No decorative display fonts.

## Layout

Three-column dashboard on desktop (≥1024px):
- Left (240px): navigation + active reminders
- Center (flexible): main content area (schedule, chat, points)
- Right (320px): context panel (today's collection, nearby points)

Two-column on tablet (≥768px): nav collapses to top bar, context panel becomes drawer.

Single column on mobile: bottom navigation bar, drawer for filters.

Spacing rhythm: strict 8px grid. Card padding: 16px. Section gaps: 24px. Page margins: 24px desktop, 16px mobile.

## Waste Type Cards (Schedule)

Each card represents one waste type for a neighborhood:
- Left accent border (4px) in the waste-type color
- Icon (32px, waste type specific) + type label
- Collection days as pills: one pill per day, filled with waste-type color at 20% opacity, text at 100%
- Time slot in `label` typography style
- Next collection date prominently displayed — bold, waste-type color
- Notes in `body-sm`, muted

Never mix waste types within a single card.

## Collection Point Cards

- Distance badge top-right (amber if >1km, green if ≤1km)
- Name in `h3`, address in `body-sm` muted
- Accepted types as small chips using each type's semantic color
- Opening hours in `mono` style
- "Criar lembrete" action button — secondary style, right-aligned

## Reminders

Reminders use a chip/tag pattern:
- Left icon: waste type icon in semantic color
- Item description truncated to 1 line
- Point name in muted text below
- Status indicator: amber dot (pendente) / green checkmark (concluído)
- "Concluído" action: swipe on mobile, button hover on desktop

## Chat Interface

Terminal-inspired but readable:
- User messages: right-aligned, `surface-container-high` background, no border
- Agent messages: left-aligned, `surface-container` background, left border 2px `primary`
- Agent suggestions (point, reminder) render as inline cards inside the message bubble
- Input bar: full width, `surface-container-lowest` background, `primary` focus ring
- Geolocation status indicator top-right of input: green dot (active) / amber dot (no GPS)

## Elevation

No traditional shadows. Hierarchy via tonal layers:
- Background `#0f1512`
- Cards / panels: `surface-container` `#1c2420`
- Input fields: `surface-container-lowest` `#0a0f0d`
- Hover states: `surface-container-high` `#262e29`
- Active/selected: `primary-container` `#00522a`

## Shapes

- Cards: 8px radius
- Badges / chips: 999px (pill)
- Buttons: 6px radius
- Input fields: 6px radius
- Map pins: circular (20px diameter)
- No chamfers, no sharp 0px corners in interactive elements

## Buttons

- **Primary**: `primary` background, `on-primary` text, 6px radius, 12px horizontal padding
- **Secondary**: `outline-variant` border, transparent background, `on-surface` text
- **Ghost**: transparent, `on-surface-variant` text, underline on hover
- **Danger**: `error-container` background, `on-error-container` text

Disabled state: 40% opacity, `not-allowed` cursor.

## Icons

Use a single icon set (Lucide or Phosphor). Waste type icons:
- Orgânico: leaf
- Reciclável: recycle arrows
- Vidro: wine-glass
- Especial: zap (pilhas/eletrônicos) / pill (medicamentos) / droplets (óleo)
- Poda: tree

Icons always paired with text labels — never icon-only except in map pins.

## Accessibility

- All interactive elements: minimum 44×44px touch target
- Color never sole indicator of meaning — always paired with icon or text
- Focus rings: 2px solid `primary`, 2px offset
- Minimum contrast 4.5:1 for body text, 3:1 for large text / UI components
