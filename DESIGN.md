# Netflix Design System

> Streaming entertainment with cinematic contrast. The public Netflix signup site is built around `Netflix Sans` / modern bold sans-serif, and a stark palette of black (`#000000`), charcoal (`#141414`, `#181818`), white (`#FFFFFF`), soft gray (`#B3B3B3`), and signature Netflix red (`#E50914`).

---

## 1. Visual Theme & Atmosphere

### Overall Aesthetic
Netflix feels like **a streaming theater interface rendered for instant conversion**. The brand is dramatic, dark, and high-contrast, with red used as a clear action signal. The UI is built for posters, carousels, and strong content imagery.

### Mood & Feeling
- Cinematic and direct
- High contrast, low ambiguity
- Promotional but not playful
- Optimized for bingeable content browsing
- Tactile media-first energy

### Design Density
**Medium to high density.** Carousels, rankings, and FAQs pack information efficiently, but the dark background and strong separation keep the layout readable.

### Visual Character
- Black canvas with red action points
- Large content art with dark overlays
- Compact controls and forms
- Heavy emphasis on immediate discovery & recommendations
- Card rails and ranking layouts with cinematic badges

---

## 2. Color Palette & Roles

### Core Foundation

| Token | Hex | Role |
|-------|-----|------|
| `--netflix-black` | `#000000` | Global background / canvas |
| `--netflix-charcoal` | `#141414` | Card and section surfaces |
| `--netflix-panel` | `#181818` | Feature tiles and elevated panels |
| `--netflix-card-hover` | `#222222` | Hover card elevation |
| `--netflix-white` | `#FFFFFF` | Text and inverse contrast |
| `--netflix-muted` | `#B3B3B3` | Secondary copy, metadata |

### Brand and Utility

| Token | Hex | Role |
|-------|-----|------|
| `--netflix-red` | `#E50914` | Primary CTA, brand emphasis, logo |
| `--netflix-red-hover` | `#C11119` | Hover state for buttons & badges |
| `--netflix-border` | `#333333` | Tile, divider, and card strokes |
| `--netflix-overlay` | `rgba(0,0,0,0.72)` | Hero image darkening and backdrop vignette |
| `--netflix-focus` | `rgba(229,9,20,0.5)` | Focus ring / contrast halo |

---

## 3. Typography Rules

### Font Stack

```css
--font-sans: "Netflix Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono: "SF Mono", Menlo, Monaco, Consolas, monospace;
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing | Color |
|---------|------|--------|-------------|----------------|-------|
| Hero Display | 56px / clamp(2.5rem, 5vw, 3.75rem) | 800-900 | 1.05 | -0.02em | `#FFFFFF` |
| Page Title | 40px | 700 | 1.1 | -0.01em | `#FFFFFF` |
| Section Title | 28px - 32px | 700 | 1.15 | -0.01em | `#FFFFFF` |
| Card Title | 20px - 24px | 700 | 1.2 | 0 | `#FFFFFF` |
| Body Large | 18px - 20px | 400 | 1.45 | 0 | `#FFFFFF` |
| Body | 15px - 16px | 400 | 1.5 | 0 | `#E5E5E5` |
| Small Body | 13px - 14px | 400 | 1.45 | 0 | `#B3B3B3` |
| Label / Badge | 12px - 13px | 700 | 1.3 | 0.04em | `#FFFFFF` |

### Typography Philosophy
Netflix typography should feel **immediate and forceful**. It exists to frame entertainment and drive action, not to linger on delicate editorial nuance.
