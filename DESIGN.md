---
name: Warm Scholastic Minimalist
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d4'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ed'
  surface-container: '#f5ece7'
  surface-container-high: '#efe6e2'
  surface-container-highest: '#e9e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#564241'
  inverse-surface: '#34302c'
  inverse-on-surface: '#f8efea'
  outline: '#897271'
  outline-variant: '#dcc0bf'
  surface-tint: '#a03e40'
  primary: '#a03e40'
  on-primary: '#ffffff'
  primary-container: '#e57373'
  on-primary-container: '#5e0c15'
  inverse-primary: '#ffb3b1'
  secondary: '#835500'
  on-secondary: '#ffffff'
  secondary-container: '#feb64c'
  on-secondary-container: '#704800'
  tertiary: '#006c4a'
  on-tertiary: '#ffffff'
  tertiary-container: '#24a978'
  on-tertiary-container: '#003522'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#80272b'
  secondary-fixed: '#ffddb4'
  secondary-fixed-dim: '#ffb954'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#633f00'
  tertiary-fixed: '#81f9c2'
  tertiary-fixed-dim: '#63dca7'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005237'
  background: '#fff8f5'
  on-background: '#1e1b18'
  surface-variant: '#e9e1dc'
dark:
  background: '#1a1715'
  surface: '#1a1715'
  surface-container-lowest: '#141110'
  surface-container-low: '#221e1c'
  surface-container: '#262220'
  surface-container-high: '#312c29'
  surface-container-highest: '#3c3633'
  on-surface: '#f0e7e2'
  on-surface-variant: '#d6c5c0'
  outline: '#9c8580'
  outline-variant: '#534340'
  primary: '#ffb866'
  on-primary: '#3a2400'
  primary-container: '#6b4a16'
  on-primary-container: '#ffdcb0'
  secondary: '#ffb3b1'
  on-secondary: '#5e0c15'
  secondary-container: '#80272b'
  on-secondary-container: '#ffdad8'
  tertiary: '#63dca7'
  on-tertiary: '#003522'
  tertiary-container: '#005237'
  on-tertiary-container: '#81f9c2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
typography:
  display-lg:
    fontFamily: Literata
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Literata
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  label-sm:
    fontFamily: Work Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  quote-decoration:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1040px
  gutter: 24px
  margin-mobile: 20px
  section-gap: 80px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is built for a focused, encouraging, and distraction-free educational environment. It centers on the concept of "The Warm Atelier" — a digital space that feels like a quiet, sun-drenched library.

The personality is **academic yet approachable**, intentionally avoiding the high-energy "gamification" typical of language apps in favor of a mature, minimalist aesthetic that respects the student's focus.

**Design Style: Minimalism with Tactile Warmth**
- **Spaciousness:** Generous white space (or "warm space") to prevent cognitive overload.
- **Organic Warmth:** A strict adherence to the warm spectrum (reds, oranges, creams) to evoke comfort.
- **Linguistic Heritage:** Subtle use of French typographic tradition, specifically the « guillemets », to ground the UI in the subject matter.
- **Tone of Voice:** Plain, encouraging, and human. All UI copy follows sentence case to remain humble and easy to read.

## Colors

The palette is strictly limited to warm tones to maintain a cohesive, "paper-like" feel.

- **Primary (Coral Red):** Used for primary actions, progress indicators, and key highlights in light mode. It provides a friendly "correction" tone that isn't as harsh as a standard red.
  - Button fill: `#a03e40` with white text (passes WCAG AA)
  - Hover/borders/large elements: `#e57373` (lighter coral)
- **Secondary (Warm Orange):** Used as the primary accent in dark mode to ensure high legibility and a glowing, candle-lit effect against the dark background.
- **Neutrals:** Based on charcoal and bone rather than pure black and white. This reduces eye strain during long study sessions.
- **Functional Usage:** Accents should be used sparingly — only for buttons, active states, and essential progress markers. Content should remain neutral.
- **Green = correctness only:** The cool-green tertiary is kept strictly for "correct answer / success" feedback. It appears nowhere else; the brand stays warm everywhere else.

## Typography

Typography is the cornerstone of this design system, prioritizing legibility and a "bookish" feel.

- **Headlines (Literata):** A warm, scholarly serif. It provides the "character" of the brand. Use for lesson titles, module headers, and the logo.
- **Body (Be Vietnam Pro):** A contemporary sans-serif with a friendly rhythm. The line height is intentionally generous (1.75x to 2x) to aid students in parsing foreign language text.
- **Labels (Work Sans):** A clean, functional sans used for metadata like "5 min read" or "Level A1".
- **Visual Motif:** Use the French guillemets (« ») from the Literata family to wrap section headers or feature callouts. Example: « L'Article du Jour ».

## Layout & Spacing

The layout follows a **fixed grid** philosophy for lesson content to mimic the focused width of a printed page.

- **Content Width:** Lesson text is capped at 720px for optimal reading speed. General dashboards use a 1040px container.
- **Vertical Rhythm:** Use large gaps (80px+) between major sections to allow the design to "breathe."
- **Responsive Behavior:**
  - **Desktop:** 12-column grid, centered content.
  - **Tablet:** 8-column grid, margins expand to 40px.
  - **Mobile:** Single column, 20px side margins, reduced vertical gaps to maintain momentum.

## Elevation & Depth

This design system avoids heavy shadows and floating effects to maintain a grounded, "stationery" feel.

- **Depth Strategy:** Tonal layers are preferred over shadows. Use a slightly darker or lighter "Surface" color to define cards.
- **Outlines:** Use thin, low-contrast borders (1px) in a warm-grey/tan color for input fields and card boundaries.
- **Shadows:** Only used for "floating" elements like dropdowns or mobile navigation bars. When used, they are extremely soft: 15% opacity of the neutral color, 20px blur, 4px offset.

## Shapes

Shapes are moderately rounded to feel friendly but structured.

- **Components:** Standard buttons and cards use a 0.5rem (8px) radius.
- **Containers:** Large lesson blocks or featured sections use 1rem (16px) to feel more prominent and softer.
- **The "Guillemet" Motif:** Use these glyphs as decorative frames rather than standard bullet points.

## Components

- **Buttons:** Solid `#a03e40` (coral red) fill for primary actions with white text. Secondary buttons use a simple coral outline. Subtle darken on hover (not heavy transitions).
- **Cards:** White surfaces with a 1px warm-grey border. No shadows. Generous internal padding (min 32px).
- **Progress Indicators:** A thin, horizontal bar using the secondary accent color. Avoid circular "rings" which can feel high-pressure.
- **Inputs:** Lightly boxed fields (not underlined) for clarity on low-quality school screens. Focus state: thicker coral bottom border.
- **Chips:** Small, pill-shaped labels with a light-tan background and neutral text for categorizing vocabulary (e.g., "Verb," "Noun").
- **Lesson Lists:** Simple vertical stacks with generous spacing and a « guillemet » icon used as the "active lesson" marker.
- **Skeleton Loaders:** Warm-tinted (not cold grey) skeleton shapes while content loads.
- **Loading Bar:** Thin horizontal progress bar (secondary accent color) with ≤8-word encouraging message after each lesson.

## Theming Implementation Notes

- Define both light and dark palettes as CSS custom properties and switch via `data-theme="dark"` or `.dark` class on `<html>`.
- Same component code, two token sets — the "one brand, two outfits" goal.
- Tailwind: extend `theme.colors` with the token names; use `dark:` variant classes.
- Verify all accent-on-background contrast ratios with a WCAG tool before locking (especially coral buttons and orange-on-dark).
- Line height for body text: confirm 1.78× feels right on long French passages once real content is in.
