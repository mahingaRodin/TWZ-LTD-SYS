---
name: Safety Core
colors:
  surface: '#101418'
  surface-dim: '#101418'
  surface-bright: '#363a3e'
  surface-container-lowest: '#0b0f12'
  surface-container-low: '#181c20'
  surface-container: '#1c2024'
  surface-container-high: '#262a2f'
  surface-container-highest: '#31353a'
  on-surface: '#e0e3e8'
  on-surface-variant: '#e4bdbb'
  inverse-surface: '#e0e3e8'
  inverse-on-surface: '#2d3135'
  outline: '#ab8887'
  outline-variant: '#5c403f'
  surface-tint: '#ffb3b1'
  primary: '#ffb3b1'
  on-primary: '#680010'
  primary-container: '#d72638'
  on-primary-container: '#fff2f1'
  inverse-primary: '#bd0b29'
  secondary: '#ffb780'
  on-secondary: '#4e2600'
  secondary-container: '#763c00'
  on-secondary-container: '#fca967'
  tertiary: '#6fd8c8'
  on-tertiary: '#003731'
  tertiary-container: '#007e72'
  on-tertiary-container: '#cdfff5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001b'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6f3800'
  tertiary-fixed: '#8cf5e4'
  tertiary-fixed-dim: '#6fd8c8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#101418'
  on-background: '#e0e3e8'
  surface-variant: '#31353a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system is built for mission-critical fire safety infrastructure. It balances industrial rigor with high-end SaaS sophistication, ensuring that life-safety data is both authoritative and accessible. The brand personality is vigilant, professional, and reliable.

The visual style is **Modern Corporate with Glassmorphic accents**. It utilizes a deep, nocturnal foundation to reduce eye strain in high-stakes monitoring environments, punctuated by high-visibility safety colors. The interface feels like a precision instrument—organized, high-contrast, and technically advanced. We employ subtle translucency and frosted-glass effects on top-level navigation and floating modals to maintain spatial awareness within complex data hierarchies.

## Colors
This design system uses a specialized high-visibility palette mapped to industrial safety standards:

- **Primary (Fire Red):** Reserved for emergencies, expired equipment, and critical "Action Required" states.
- **Secondary (Inspection Amber):** Used for warnings, upcoming maintenance, and cautionary data points.
- **Accent (Maintenance Teal):** Signifies healthy status, completed inspections, and verified safety records.
- **Neutral/Surface:** A tiered dark-mode system. The background (#101418) provides maximum contrast for data, while the surface (#1B232D) defines functional containers.
- **Text:** High-luminance white (#F8FAFC) ensures readability against dark backgrounds, with reduced opacity variants for secondary metadata.

## Typography
The system relies exclusively on **Inter** to project a functional, systematic, and utilitarian aesthetic. 

- **Headlines:** Use tighter letter-spacing and heavier weights to command attention in dashboards.
- **Labels:** Small caps or all-caps with increased letter-spacing are used for technical metadata (e.g., Serial Numbers, Floor Zones).
- **Data Density:** Body-md (14px) is the primary workhorse for data tables and property panels to ensure high information density without sacrificing legibility.
- **Hierarchical Contrast:** Use weight (SemiBold vs Regular) rather than color shifts to denote importance, maintaining high accessibility standards.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Dashboards utilize a 12-column fluid grid for data widgets, while specialized inspection forms use a centered fixed-width column (800px) to prevent eye fatigue.

- **Grid:** 12 columns with 24px gutters for desktop.
- **Rhythm:** An 8px linear scale (with a 4px step for tight UI components) governs all padding and margins.
- **Mobile:** Elements reflow to a single column with 16px side margins. Horizontal scrolling is permitted for large data tables to preserve data integrity.
- **Density:** High-density layouts are preferred for professional inspectors; use "md" (16px) spacing for primary containers and "sm" (8px) for internal component grouping.

## Elevation & Depth
Depth is signaled through a combination of **Tonal Layering** and **Glassmorphism**:

1.  **Level 0 (Floor):** Background color (#101418).
2.  **Level 1 (Cards/Widgets):** Surface color (#1B232D) with a subtle 1px border (#2D3748) and a soft, 4% opacity black shadow.
3.  **Level 2 (Modals/Overlays):** Glassmorphic surfaces. Use the Surface color at 80% opacity with a 20px Backdrop Blur. This keeps the underlying dashboard context visible while focusing the user.
4.  **Shadows:** Shadows are intentionally minimal and "cold" (using dark blue-grey tints) to avoid a "soft" consumer look. Focus on crispness and edge definition.

## Shapes
The design system employs a **12px (0.75rem) standard radius** for all primary containers, cards, and large buttons.

- **Base Radius:** 12px for cards and major UI blocks.
- **Small Components:** Inputs and tags use a 6px radius to maintain a precise, technical feel.
- **Interactive Elements:** Buttons use the 12px standard to feel substantial and easy to tap on mobile devices during field inspections.

## Components

### Buttons
- **Primary:** Background Fire Red (#D72638), white text. Used for "Start Inspection" or "Report Fault."
- **Secondary:** Outlined with 1px Surface border, white text.
- **Ghost:** No background, subtle hover state. Used for utility actions.

### Data Cards
Cards should feature a 4px left-border accent color corresponding to the status (Red for expired, Teal for compliant). This allows for rapid scanning of equipment health.

### Inputs & Fields
Field-heavy inspection forms require clear focus states. Active inputs should use a 1px Primary (Red) border with a subtle glow effect. Labels must always be visible (no floating labels) to ensure clarity in high-pressure environments.

### Status Chips
Small, high-contrast badges.
- **Urgent:** Red background, white text.
- **Pending:** Amber background, dark text.
- **Certified:** Teal background, white text.

### Inspection Checklists
Custom radio buttons and checkboxes are enlarged (min 24px touch target) for use with gloves in the field. Use high-contrast ticks and fills to indicate "Pass" or "Fail" clearly.