---
name: Obsidian Neon
colors:
  surface: '#111415'
  surface-dim: '#111415'
  surface-bright: '#373a3b'
  surface-container-lowest: '#0c0f10'
  surface-container-low: '#191c1d'
  surface-container: '#1d2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#323536'
  on-surface: '#e1e3e4'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e1e3e4'
  inverse-on-surface: '#2e3132'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#e9b3ff'
  on-secondary: '#510074'
  secondary-container: '#7d01b1'
  on-secondary-container: '#e5a9ff'
  tertiary: '#f8f5f5'
  on-tertiary: '#313030'
  tertiary-container: '#dcd9d8'
  on-tertiary-container: '#5f5e5e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#f6d9ff'
  secondary-fixed-dim: '#e9b3ff'
  on-secondary-fixed: '#310048'
  on-secondary-fixed-variant: '#7200a3'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#111415'
  on-background: '#e1e3e4'
  surface-variant: '#323536'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  stats-num:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is centered on a high-end, multiplayer gaming experience characterized by "Dark Glassmorphism." The aesthetic balances deep, atmospheric mystery with high-energy neon precision. It targets a sophisticated gaming audience that values performance, clarity, and immersive depth.

The style is a **Pure 2D Flat UI/UX** approach that simulates depth through layering and optical transparency rather than skeuomorphic textures. It leverages:
- **Glassmorphism:** Frosted, translucent panels that provide a sense of place within a shifting digital environment.
- **Neon Accents:** Vibrant, glowing highlights that guide user attention and denote interactivity.
- **Ultra-Sharp Vector Precision:** Every edge is crisp, with 1px strokes and perfectly aligned geometry to ensure a premium, "Dribbble Showcase" quality.

## Colors

The palette is anchored in deep, dark gradients to provide maximum contrast for the glass elements and neon accents. 

- **Primary (Electric Cyan):** Used for critical actions, active states, and primary player stats.
- **Secondary (Neon Purple):** Reserved for rare items, special abilities, and secondary navigation cues.
- **Surface Strategy:** Backgrounds must use the defined three-stop gradient to create an expansive sense of space. UI panels use a low-opacity white fill with a significant backdrop blur to achieve the "frosted" effect.
- **Accents:** Neon colors should employ a subtle outer glow (0-4px blur) to simulate light emission without muddying the flat vector aesthetic.

## Typography

Typography prioritizes legibility amidst complex game backgrounds. 
- **Sora** is used for impactful headings and display text, providing a high-tech, geometric feel.
- **Inter** handles the bulk of the UI text, ensuring clarity in chat logs, descriptions, and settings.
- **JetBrains Mono** is utilized for technical data, coordinates, and "system" labels to reinforce the digital, futuristic narrative.
- **Contrast:** Always use high-contrast white or primary cyan for text on dark glass to ensure accessibility.

## Layout & Spacing

This design system follows a **Mobile-First Fluid Grid** optimized for landscape and portrait gaming orientations.

- **Margins:** A strict 20px safe area is maintained around the screen edges to accommodate various device notches and rounded corners.
- **Rhythm:** An 8px base unit drives all spacing.
- **Panel Layout:** Functional blocks (Map, Inventory, Chat) should be treated as floating glass "islands" rather than edge-to-edge containers, maintaining the sense of depth by showing the background gradient through the gaps.

## Elevation & Depth

Depth is communicated through **Optical Stacking** rather than traditional drop shadows.

1.  **Level 0 (Background):** Deep dark gradient with subtle noise texture.
2.  **Level 1 (Secondary Panels):** Glass surfaces with `backdrop-blur(12px)` and `bg-white/5`.
3.  **Level 2 (Primary Panels/Modals):** Glass surfaces with `backdrop-blur(20px)`, `bg-white/10`, and a `1px` solid border (`white/20`).
4.  **Level 3 (Active Elements):** Buttons and active chips featuring a `2px` neon inner-glow or outer-glow.

Avoid black shadows; use the transparency and blurring of the layers to create a natural "lift."

## Shapes

The shape language is sophisticated and modern. 
- All glass panels and buttons use a **0.5rem (8px)** base radius for a balanced, premium feel. 
- **Large containers** (like character cards) may use **1rem (16px)** to feel more encapsulated.
- **Hard edges** are strictly avoided to maintain the "liquid glass" aesthetic, but the curves are never so extreme that they become playful or "bubbly."

## Components

### Buttons
- **Primary:** Solid `primary_color_hex` (Neon Blue) with black text. High-density glow effect.
- **Secondary:** Glass background with a `1px` neon border and white text.
- **Ghost:** Transparent background, white text, no border until hover/active state.

### Input Fields
- Dark, semi-transparent backgrounds (`white/5`).
- Underline-only focus states using the `primary_color_hex` to maintain a sleek, minimal profile.

### Cards & Panels
- Must use `backdrop-filter: blur()`.
- Borders should be top-heavy (gradient stroke from `white/30` at the top to `white/5` at the bottom) to simulate a top-down light source.

### Progress Bars
- Background: `white/10`.
- Fill: Linear gradient from `secondary_color_hex` to `primary_color_hex`.
- Include a 4px glow on the "leading head" of the progress fill.

### Status Chips
- Small, pill-shaped glass elements. Use the `label-caps` typography style.
- Color-coded icons (Red for health, Blue for mana, Purple for XP).