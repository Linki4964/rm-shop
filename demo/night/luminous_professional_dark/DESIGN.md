---
name: Luminous Professional Dark
colors:
  surface: '#11131b'
  surface-dim: '#11131b'
  surface-bright: '#373942'
  surface-container-lowest: '#0c0e16'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#282a32'
  surface-container-highest: '#32343d'
  on-surface: '#e1e2ed'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#e1e2ed'
  inverse-on-surface: '#2e3039'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#ffb596'
  on-tertiary: '#581e00'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#11131b'
  on-background: '#e1e2ed'
  surface-variant: '#32343d'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is a premium, high-fidelity interface designed for professional environments that require focus and depth. The aesthetic leverages **Glassmorphism** and **Minimalism** to create a sophisticated "Command Center" feel. 

The brand personality is authoritative yet ethereal. By utilizing deep navy substrates and vibrant, translucent overlays, the UI evokes a sense of cutting-edge technology and calm precision. The target audience includes data analysts, executives, and power users who operate in low-light environments and value high-contrast legibility paired with modern visual flair.

## Colors
The palette is rooted in a deep "Midnight Navy" (`#0F172A`) to provide a stable, low-fatigue background. 

- **Primary Blue:** `#2563EB` is used for high-signal actions and key brand moments. In dark mode, this color is often paired with an outer glow or high-vibrancy treatment.
- **Surface Tones:** Layers are built using slate-tinted glass. Backgrounds use `#1E293B` with varying degrees of transparency to maintain depth.
- **Contrast:** Text colors are pushed towards pure white (`#F8FAFC`) and light silver (`#94A3B8`) to ensure AAA accessibility against dark backgrounds.
- **Interaction:** Hover states utilize a secondary sky blue (`#38BDF8`) to provide a "light-up" effect when the user engages with elements.

## Typography
This design system utilizes **Manrope** exclusively to maintain a modern, geometric, yet highly readable professional tone. 

Headlines use heavy weights (Bold/ExtraBold) to cut through the glass textures and background blurs. For body text, a slightly increased line-height is applied to prevent "light bleed" (halatuation) often found in high-contrast dark mode designs. Uppercase labels are used for metadata to provide structural hierarchy without cluttering the interface.

## Layout & Spacing
The layout follows a strict **8px grid system**, ensuring all elements align to a predictable rhythm. 

- **Desktop:** A 12-column fluid grid with 24px margins. Content is grouped into glass "modules" that sit on the midnight navy base.
- **Mobile:** A 4-column grid with 16px margins. Stacked elements are preferred, with vertical spacing increased to 32px between major sections to maintain the minimalist breathability.
- **Padding:** Internal container padding should never drop below 16px to ensure the rounded corners do not clip content.

## Elevation & Depth
Depth is created through **Glassmorphism** rather than traditional drop shadows. 

1.  **The Base:** The bottom-most layer is the solid `#0F172A` background.
2.  **The Surface:** Floating containers use a semi-transparent slate fill (`rgba(30, 41, 59, 0.7)`) with a `blur(12px)` backdrop filter.
3.  **The Stroke:** Every elevated element features a 1px inner border (top and left at 20% white, bottom and right at 10% white) to simulate a light source from the top-left hitting the edge of the glass.
4.  **Active Depth:** When an element is focused, a subtle blue outer glow (`#2563EB` at 30% opacity) is applied to simulate luminosity.

## Shapes
In alignment with the "Luminous" aesthetic, all corners are softened to feel approachable and premium. The system uses a **base radius of 8px (0.5rem)**.

- **Standard Elements:** (Buttons, Inputs, Small Cards) use 8px.
- **Large Containers:** (Main Dashboard Cards, Modals) use 16px (`rounded-lg`).
- **Interactive Indicators:** (Active Tab Bars, Selection Pills) use a full pill shape to distinguish them from structural containers.

## Components
- **Buttons:** Primary buttons are solid `#2563EB` with white text. On hover, they gain a 10px blue blur shadow. Secondary buttons are glass-filled with a white stroke.
- **Input Fields:** Semi-transparent dark backgrounds with a 1px border. On focus, the border transitions to Primary Blue and the background blur intensifies.
- **Cards:** Glassmorphic containers with the 1px highlight stroke. Headers inside cards should be separated by a subtle 1px divider (`rgba(255, 255, 255, 0.1)`).
- **Chips/Tags:** Small, high-contrast labels. Use a dark navy background with Primary Blue text for a "neon" effect.
- **Status Indicators:** Use vibrant, saturated colors (Emerald for success, Rose for error) with a small outer glow to ensure they pop against the dark background.
- **Lists:** Clean rows separated by transparency shifts rather than lines. Hovering over a list item should lighten the background to `rgba(255, 255, 255, 0.05)`.