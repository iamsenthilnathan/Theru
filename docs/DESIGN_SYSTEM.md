# Theru Design System Foundation

The Theru design system provides a token-driven, accessible, and coherent foundation for Theru's geospatial street food discovery experience. It harmonizes the 3D WebGL neighborhood world with screen-facing 2D UI layers, ensuring clarity, consistency, and tactile delight.

---

## 1. Principles

1. **Geographic Grounding & Spatial Harmony**  
   Theru connects digital information with physical street life. Screen-facing 2D elements and 3D geospatial entities must feel physically anchored. We never dominate or obscure physical structures unnecessarily.
2. **Consistency Over Novelty**  
   Every interactive element uses shared semantic tokens. We avoid one-off colors, arbitrary margins, and rogue border radii.
3. **Token-Driven Hierarchy**  
   Visual decisions stem from named design tokens (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, `--shadow-*`). Changes to tokens propagate across the entire product.
4. **Accessible by Default**  
   All controls support visible keyboard focus rings (`:focus-visible`), WCAG AA contrast ratios, screen-reader text where icons lack labels, and graceful interaction across touch, mouse, and keyboard.
5. **Sentence Case & Cultural Authenticity**  
   All titles, button labels, and body text adhere to sentence case (e.g., "Add food spot", not "ADD FOOD SPOT" or "Add Food Spot"). Tamil transliterations and scripts are treated as first-class content alongside English.
6. **Restraint & Discovery**  
   Visual cues inside the 3D world (especially for shops attached to existing buildings) must remain grounded in real street architecture—canopies, entrance lamps, counter sills—rather than video-game floats or billboard clutter.

---

## 2. Design Tokens

Design tokens are defined in [`src/styles/tokens.css`](file:///d:/Antigravity/Theru/src/styles/tokens.css) and mirrored for Three.js 3D rendering in [`src/styles/tokens.ts`](file:///d:/Antigravity/Theru/src/styles/tokens.ts).

### 2.1 Color Palette & Semantics

| Token | Value | Semantic Usage |
|---|---|---|
| `--color-surface-card` | `#ffffff` | Background for modals, detail cards, floating pills |
| `--color-surface-subtle` | `#f8f9fa` | Input backgrounds, subtle cards, secondary containers |
| `--color-surface-hover` | `#f1f3f5` | Hover background for secondary buttons and chips |
| `--color-border-subtle` | `#e9ecef` | Card borders, dividers, subtle separators |
| `--color-border-strong` | `#dee2e6` | Form input borders, chip outlines, structural borders |
| `--color-brand-primary` | `#e03131` | Theru warm street red — primary actions, active pins, badges |
| `--color-brand-hover` | `#c92a2a` | Hover state for brand buttons and interactive anchors |
| `--color-brand-subtle` | `#ffe3e3` | Subtle red highlights, tag backgrounds, pin glow bubbles |
| `--color-accent-orange` | `#fd7e14` | Hot food highlight, focus indicator, tea/baking indicator |
| `--color-accent-green` | `#2b8a3e` | Verified status, vegetarian badge, open status |
| `--color-accent-blue` | `#228be6` | Building selection, geo-location highlight, leader lines |
| `--color-text-primary` | `#1a1a1a` | High-contrast body text, headings |
| `--color-text-secondary` | `#495057` | Form labels, metadata, secondary body copy |
| `--color-text-muted` | `#868e96` | Helper text, placeholder copy, photo counters |
| `--color-focus` | `#fd7e14` | Universal high-visibility outline for `:focus-visible` |

### 2.2 Typography Scale

- **Primary Font Family**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
- **Display / Heading Font Family**: `'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif`

| Token | Size | Line Height | Usage |
|---|---|---|---|
| `--font-size-2xs` | `10px` | `1.2` | Micro badges, leader-line tags, avatar letters |
| `--font-size-xs` | `12px` | `1.4` | Helper hints, meta attributes, chip labels, subtext |
| `--font-size-sm` | `13.5px` | `1.45` | Form labels, input text, billboard names, button labels |
| `--font-size-base` | `15px` | `1.5` | Standard body text, primary input inputs |
| `--font-size-lg` | `18px` | `1.3` | Section headings, card titles |
| `--font-size-xl` | `21px` | `1.2` | Modal titles, spot detail headings |
| `--font-size-2xl` | `26px` | `1.15` | Neighborhood hero title |

### 2.3 Spacing Scale (4px/8px Geometric Base)

| Token | Size | Typical Usage |
|---|---|---|
| `--space-3xs` | `2px` | Internal icon padding, radio dot margins |
| `--space-2xs` | `4px` | Button icon gaps, badge vertical padding, chip gaps |
| `--space-xs` | `8px` | Input internal padding, chip padding, item separation |
| `--space-sm` | `12px` | Card content gaps, banner padding, row gaps |
| `--space-md` | `16px` | Modal padding, section separation, search bar margins |
| `--space-lg` | `24px` | Modal internal margin, detail card section padding |
| `--space-xl` | `32px` | Floating control margins, corner offsets |
| `--space-2xl` | `48px` | Neighborhood viewport padding |

### 2.4 Border Radii

| Token | Size | Usage |
|---|---|---|
| `--radius-2xs` | `4px` | Micro badges, focus rings, tag chips |
| `--radius-xs` | `6px` | Small action buttons, thumbnail corners |
| `--radius-sm` | `8px` | Form inputs, select menus, photo thumbnails |
| `--radius-md` | `10px` | Summary cards, alert boxes |
| `--radius-lg` | `12px` | Location cards, dropdown menus, callouts |
| `--radius-xl` | `16px` | Food detail card corners (desktop) |
| `--radius-2xl` | `20px` | Modal dialog cards, mobile bottom sheets |
| `--radius-full` | `9999px` | Action pills, search input, billboard tags, avatar icons |

### 2.5 Shadows & Elevation

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Subtle chips, billboard pills |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)` | Search dropdown, hovered chips |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | Floating control stacks, HUD banners |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | Detail drawer, bottom sheet |
| `--shadow-modal`| `0 20px 50px rgba(0,0,0,0.24)` | Modal cards, heavy overlays |
| `--shadow-glow-red`| `0 4px 14px rgba(224,49,49,0.28)` | Primary action buttons |

### 2.6 Motion & Transitions

- `--transition-fast`: `0.15s cubic-bezier(0.16, 1, 0.3, 1)` (hover states, focus toggles)
- `--transition-base`: `0.22s cubic-bezier(0.16, 1, 0.3, 1)` (drawer open/close, banner entry)
- `--transition-slow`: `0.35s cubic-bezier(0.16, 1, 0.3, 1)` (camera smooth pivots)

### 2.7 Z-Index Layering Order

```
Canvas / 3D Scene   : 0
Billboard Anchors   : 10
Reticle / Hint HUD  : 50
Controls Stack      : 100
Detail Drawer       : 500
Placement Banner    : 950
Modal Overlays      : 1000
Cursor Follower HUD : 2000
```

---

## 3. Primitives & Components

### 3.1 Button (Primary Action & Pill)

**Purpose**: High-emphasis interactive trigger for actions like "+ Add food spot", "Suggest dish", and "Submit".

- **Tokens**:
  - Background: `--color-brand-primary` (Hover: `--color-brand-hover`, Active: `--color-brand-active`)
  - Text: `--color-surface-card`
  - Radius: `--radius-full`
  - Shadow: `--shadow-glow-red`
  - Focus Ring: `2px solid var(--color-focus); outline-offset: 2px`
- **States**:
  - *Default*: High contrast red pill with crisp white text.
  - *Hover*: Darker red (`--color-brand-hover`), elevates by `-1px`, shadow expands.
  - *Active*: Depresses by `+1px`, shadow tightens.
  - *Focus-Visible*: Clear orange focus ring with 2px offset.
  - *Disabled*: `opacity: 0.5`, `cursor: not-allowed`, no box shadow.
- **Copy Guidance**: Sentence case with action verbs (e.g., "Add food spot", "Save details", "Cancel").

### 3.2 Icon Button

**Purpose**: Compact circular button used for navigation controls (Zoom in, Zoom out, Pitch tilt, Theme toggle, Reset compass) and modal close triggers.

- **Tokens**:
  - Size: `36px x 36px` (touch-target compliant)
  - Background: `rgba(255, 255, 255, 0.95)` with backdrop blur `8px`
  - Border: `1px solid var(--color-border-subtle)`
  - Radius: `--radius-full`
  - Icon Fill: `--color-text-secondary` (Hover: `--color-text-primary`)
- **States**:
  - *Default*: Clean circular white button.
  - *Hover*: Background `--color-surface-hover`, icon shifts to dark gray.
  - *Active*: Scales slightly to `0.96`.
  - *Focus-Visible*: Orange focus ring.
- **Accessibility**: Must have descriptive `aria-label` or `title` (e.g. `aria-label="Tilt camera pitch"`).

### 3.3 Search Input & Form Input

**Purpose**: Discovery query input in top navigation and data capture fields in modals.

- **Tokens**:
  - Text: `--color-text-primary`
  - Placeholder: `--color-text-muted`
  - Border: `1.5px solid var(--color-border-strong)`
  - Border Focus: `--color-border-focus`
  - Background: `--color-surface-card` (Subtle in modals: `--color-surface-subtle`)
  - Radius: `--radius-full` (Search bar) / `--radius-sm` (Modal forms)
- **States**:
  - *Default*: Crisp border, subtle placeholder.
  - *Focus*: Red highlight border with subtle brand red ambient glow (`0 0 0 3px rgba(224, 49, 49, 0.12)`).
  - *Error*: Red border with error text beneath.
- **Copy Guidance**:
  - Search Placeholder: "Search kothu parotta, tea, bajji, shawarma..." (sentence case, local dishes).

### 3.4 Tabs (Navigation Bar in Detail Panel)

**Purpose**: Segmenting content between Bestsellers, Community Menu, Photos, and Reviews.

- **Tokens**:
  - Container Background: `--color-surface-subtle`
  - Active Tab Background: `--color-surface-card`
  - Active Text: `--color-text-primary`
  - Inactive Text: `--color-text-muted`
  - Radius: `--radius-full`
- **States**:
  - *Active*: Elevated with `--shadow-sm`, bold text.
  - *Hover (Inactive)*: Subtle text color shift to `--color-text-secondary`.
  - *Keyboard Focus*: Focus ring conforms to tab capsule.
- **Accessibility**: Proper `role="tablist"`, `role="tab"`, and `aria-selected` attributes.

### 3.5 Modal Dialogs

**Purpose**: Focused creation flows ("Add food spot", "Suggest a dish").

- **Anatomy**:
  1. Backdrop: `--color-modal-backdrop` with `5px` backdrop blur.
  2. Header: Title (Space Grotesk), subtitle badge, and close icon button.
  3. Context Bar: Geospatial coordinate readout and building attachment summary.
  4. Body: Scrollable form inputs and chip pickers.
  5. Footer: Cancel button (secondary) and Primary action button.
- **Key Interactions**:
  - `Escape` key dismisses modal.
  - Traps focus inside modal while open.
  - Click outside closes unless inputs are dirty.

### 3.6 Food Detail Panel

**Purpose**: Geospatial side drawer displaying comprehensive community knowledge about the selected FoodSpot.

- **Anatomy**:
  - Header: Spot name (English + Tamil script), cuisine tags, price tier (`₹`, `₹₹`, `₹₹₹`), and road address.
  - Quick Info Row: Operational hours, physical setup badge, verification indicator.
  - Tabs: Bestsellers, Menu, Photos, Reviews.
  - Action Bar: "Suggest dish", "Get directions", "Share".
- **Responsive Handling**:
  - Desktop (>768px): Anchored floating drawer on the right side (`top: 80px; width: 380px`).
  - Mobile (≤768px): Slides up as an ergonomic bottom sheet (`max-height: 80vh; border-radius: 20px 20px 0 0`).

### 3.7 Tooltip & Placement HUD

**Purpose**: Real-time cursor context during map interaction and exploration.

- **Placement Mode Banner**:
  - Position: Fixed at top-center (`top: 76px`).
  - Style: Floating pill with pulsing red pin and instructional copy ("Click map or building to position spot").
  - Includes quick "Cancel placement" button.
- **Dynamic Cursor HUD**:
  - Follows cursor at an offset of `+14px, +14px`.
  - Variants:
    - *Building Target*: Blue badge `"Attach to [Building Name]"`.
    - *Road/Open Space Target*: Green badge `"Place roadside stall"`.
    - *Invalid Target*: Red badge `"Invalid location"`.

### 3.8 Chips & Badges

**Purpose**: Concise attribute tags for food categories, setup types, and pricing.

- **Physical Setup Chips**:
  - Types: Cart (`🛒`), Stall (`⛺`), Van (`🚐`), Scooter (`🛵`), Existing Building (`🏢`).
  - Active: Accent orange border and subtle orange background (`#fff4e6`).
- **Category Badges**:
  - Pill badges (`--radius-full`) with 12px text.
  - Active: Dark neutral background with white text.

### 3.9 FoodSpot Annotation (2D Billboard Pill)

**Purpose**: High-fidelity WhereWeWork-style 2D label attached to 3D geographic coordinates.

- **Anatomy**:
  - Leader Line: Clean 1.25px SVG vector connecting anchor pin to billboard card.
  - Anchor Dot: Small circle on ground or building roof.
  - Billboard Pill: White blurred card containing avatar letter, spot name, and price tier.
- **Behavior**:
  - Screen-facing: Never rotates or distorts in 3D perspective.
  - Automatic Decluttering: Staggered vertical offsets prevent overlapping.
  - Interactive: Hovering highlights line and dot; clicking smoothly focuses camera and opens panel.

### 3.10 Food Presence Facade Cue (Existing-Building Visual Identity)

**Purpose**: Physical visual cues attached to existing buildings so street food spots are discoverable directly in the 3D scene without needing floating billboards alone.

- **Architectural Elements**:
  1. *Doorstep Threshold Slab*: 6cm raised dark granite entry plinth extending slightly from the road-facing wall.
  2. *Storefront Counter & Frame*: Teak wooden counter sill (`0.85m` working height) with recessed dark facade window.
  3. *Striped Fabric Awning*: Canonical Indian street stall striped fabric canopy (crimson red & warm cream / amber orange & white) extending `0.65m` outward at `2.1m` height.
  4. *Storefront Signboard Plaque*: Crisp wooden/acrylic signboard mounted above the awning with spot branding.
  5. *Warm Entrance Bracket Lamp*: Brass gooseneck lamp fixture emitting subtle ambient warm point light (`#ffecb3`).
  6. *Ground Halo*: Warm radial glow on the sidewalk demarcating the welcoming doorstep zone.
- **Placement Logic**:
  - Automatically attached to the **road-facing facade wall** computed from the neighborhood road network.
  - Supports **multiple spots in the same building** via distributed horizontal slot offsets along the facade tangent.

---

## 4. Accessibility & Quality Checklist

Before shipping any UI or 3D interaction changes:

- [x] **Focus Rings**: All interactive elements display a 2px high-contrast `--color-focus` outline on `:focus-visible`.
- [x] **Contrast**: Text elements meet WCAG 2.1 AA (4.5:1 for body copy, 3:1 for large display text).
- [x] **Touch Targets**: All clickable buttons and controls have at least `36px x 36px` interactive bounds.
- [x] **Copy Standards**: All UI strings are in sentence case.
- [x] **Tamil Script Integrity**: Tamil translations and dish names render with proper Unicode rendering.
- [x] **Semantic Tokens**: No raw hardcoded HEX colors or arbitrary margins in CSS files; all point to tokens.
- [x] **Keyboard Navigation**: Modals trap focus and allow `Esc` dismissal; search input supports standard shortcuts.
- [x] **3D Performance**: Storefront geometry shares materials and geometries where possible to preserve 60fps WebGL rendering.
