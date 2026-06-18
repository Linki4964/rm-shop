---
name: Luminous Professional
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#525657'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b6e70'
  on-tertiary-container: '#eff1f3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system evolves the "Modern Professional" aesthetic into a high-end, editorial experience. It balances corporate reliability with a soft, ethereal quality. The target audience includes executive leadership and specialized professionals who value clarity and a sophisticated digital environment.

The style is a refined hybrid of **Glassmorphism** and **Minimalism**. It utilizes depth through translucent layers, heavy backdrop blurs, and expansive whitespace. The emotional response is one of "calm authority"—the UI feels breathable, premium, and technologically advanced without being aggressive.

## Colors

The palette is centered on an elegant "Professional Blue," applied with restraint to maintain a premium feel. 

- **Primary:** Used for intentional focal points, active states, and critical actions.
- **Glass Surfaces:** The core of the system. Rather than solid white backgrounds, use semi-transparent whites with a high saturation of backdrop-blur (20px - 40px).
- **Gradients:** Subtle, low-contrast linear gradients (e.g., from a soft tint of primary to transparent) are used to give depth to cards and headers.
- **Neutrals:** Deep slates and cool greys provide high-legibility contrast for typography against the luminous glass backgrounds.

## Typography

The typographic hierarchy prioritizes a modern, balanced look. **Manrope** provides a refined, slightly geometric feel for headlines, while **Inter** ensures maximum readability for functional body text. 

For technical data or metadata, **JetBrains Mono** is used sparingly in uppercase to add a layer of precision and "pro-tool" aesthetic. Line heights are generous to reinforce the airy, open feel of the brand.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid** model. Content is contained within a 1280px max-width wrapper for desktop, while internal elements utilize fluid percentage-based widths with a strictly enforced 8px baseline grid.

- **Desktop:** 12-column grid, 24px gutters, 64px side margins.
- **Tablet:** 8-column grid, 20px gutters, 32px side margins.
- **Mobile:** 4-column grid, 16px gutters, 20px side margins.

Negative space is treated as a first-class design element; components should have ample internal padding (minimum 24px) to feel premium and uncrowded.

## Elevation & Depth

Depth is achieved through layering and optical physics rather than heavy shadows.

- **Surface Tiers:** Backgrounds use a soft light-grey (`#F8FAFC`). Primary containers (cards, sidebars) use the glass effect: `white 70% opacity` with a `40px backdrop-blur`.
- **Shadows:** Use extremely soft "ambient" shadows. Instead of black, use a tinted shadow (e.g., Primary Blue at 5% opacity) with a large blur radius (30px+) and 0 offset.
- **Borders:** Every glass element must have a 1px inner border of `white 40% opacity` to simulate the "edge" of a glass pane, catching the light.

## Shapes

The shape language is defined by significant corner rounding to evoke friendliness and modern luxury. 

Standard components use a **12px (0.75rem)** radius. Large containers, such as dashboard cards and modals, should use **24px (1.5rem)**. This high level of roundness softens the "corporate" edge of the blue palette and creates a more organic, approachable interface. Interactive elements never use sharp corners.

## Components

### Buttons
- **Primary:** Solid Primary Blue with a very subtle vertical gradient. 12px border radius. White text.
- **Secondary/Ghost:** Glass surface (20% opacity white) with a 1px border. Hover state increases the opacity of the glass.

### Cards
- Always utilize the glassmorphism effect.
- 24px internal padding.
- 1px "highlight" border on the top and left sides to simulate light hitting a physical edge.

### Navigation Bars
- Floating top navigation with a 100% width but internal padding. 
- Heavy backdrop-blur (60px) to allow content to scroll underneath beautifully while maintaining legibility.

### Inputs
- Backgrounds are slightly recessed (5% primary blue tint). 
- On focus, the border glows with a soft 4px blue shadow and the background clears to white.

### Chips
- Pill-shaped with a 32px radius. 
- Use low-saturation tints of the status colors (Success Green, Warning Amber) to maintain the "soft" brand personality.