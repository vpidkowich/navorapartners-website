# Navora Partners — Homepage Build

## Project Overview
Single-page marketing site for Navora Partners, an e-commerce paid media agency.
Built from a Figma design, currently in cleanup/iteration phase.

## Tech Stack
- Single HTML file with inline CSS (no build tools)
- Fonts: Roslindale (heading, loaded via @font-face from fonts/roslindale/), Satoshi (body), Inter Tight (labels), Inria Serif (accents)
- No JavaScript framework — vanilla HTML/CSS
- Target: modern browsers, desktop-first (responsive later)

## Design Reference
- Figma file: https://www.figma.com/design/GYND5aAIndruM8wGLmljVo/Navora-Design?node-id=47-3&t=W8oOjKQfBGKHJG6M-4
- Color palette: Jade (#024742), Dark Navy (#0b1c2e), Dark BG (#282828), Cream (#faf9f5), Gold (#ffe174), Orange (#ff6b00)
- Reference site for button hover effects: rankings.io (gradient slide left-to-right, arrow shifts right, 400ms)

## Section Map (14 sections)
1. Header (sticky nav)
2. Hero
3. Accomplishments (stats bar)
4. Why Navora Partners
5. Case Studies
6. Who We Help
7. Pillars / How We Help
8. Truth
9. Growth Strategy
10. Process
11. Founder Access
12. Testimonial Carousel
13. Final CTA
14. Footer

## Iteration Workflow
- Work section by section, top to bottom
- User provides Figma screenshot for each section

### Internal Self-Review (before asking user to review)
Before presenting changes for user review, Claude must:

**Step 1 — Render and screenshot**: Use the Figma MCP `get_screenshot` tool or open the HTML file and take a screenshot of the rendered section to visually compare against the user-provided Figma screenshot.

**Step 2 — Visual diff against user's screenshot**: Place both screenshots side by side (the user's Figma screenshot and the rendered output) and identify every discrepancy:
1. **Layout**: Compare element positions, flex/grid structure, column counts, alignment
2. **Spacing**: Check padding, margin, gap values — estimate pixel differences between the two screenshots
3. **Typography**: Verify font-family, size, weight, line-height, letter-spacing, color
4. **Colors**: Match backgrounds, text, borders, shadows against the design tokens and screenshot
5. **Interactive states**: Verify hover effects, transitions, and cursor states are working and have proper contrast
6. **Content**: Ensure text matches exactly — no missing words, no extra words
7. **CSS specificity**: Check that styles are not being overridden by more specific selectors elsewhere (common issue with nav links vs buttons)
8. **Contrast**: All text must be readable against its background in both default and hover states — never let text color match or blend with background

**Step 3 — Fix and re-check**: Fix all discrepancies found, then re-read the modified CSS in full context to catch cascade/specificity conflicts. Repeat Steps 1-2 if changes were significant.

**Step 4 — Present for review**: Only present to user once the rendered output is ≥95% accurate to the screenshot. List any remaining known differences when presenting.

## Known Issues
- All images are placeholder divs — real image paths TBD (later phase)
- No responsive/mobile styles yet (desktop-first, responsive is a later phase)

## Future Phase: Spacing Standardization (8px Grid System)
Before the responsive pass, standardize all spacing across the homepage using an 8px grid system. This will be done **section by section**, top to bottom. Full plan is saved at `plans/dreamy-rolling-scroll.md`.

### Spacing Scale
| Token | Value | Use Case |
|-------|-------|----------|
| 2xs | 4px | Micro-adjustments only |
| xs | 8px | Icon-text gaps, tight spacing |
| sm | 16px | Button gaps, list spacing, small margins |
| md | 24px | Heading-to-paragraph, label margins, card internals |
| lg | 32px | Component gaps, card padding, grid gaps |
| xl | 48px | Sub-section spacing, CTA padding |
| 2xl | 64px | Between content groups within a section |
| 3xl | 80px | Section padding (minor sections) |
| 4xl | 96px | Section padding (major sections) |
| 5xl | 112px | Horizontal page margins |

### Key Principles
1. **Internal ≤ External**: Padding inside components ≤ margin outside them
2. **Three-tier hierarchy**: Large (80-96px sections), medium (24-48px components), small (8-16px elements)
3. **Start generous, then tighten** — not the opposite
4. **Line-height**: Titles 1.2, subtitles 1.3, body 1.5
5. **Paragraph spacing ≈ font-size** of the body text
6. **Optical adjustments** (±4px) are allowed when something looks off
7. **Consistent rhythm**: Same element type = same spacing everywhere

### Implementation approach
- Add CSS custom properties (`--space-xs` through `--space-5xl`) to `:root`
- Go section by section, snapping values to the 8px grid
- Replace hardcoded px values with `var(--space-*)` tokens
- Visual review after each section
- Once each section is approved, document the finalized spacing values into the Design System (spacing tokens, per-component spacing rules, and any section-specific patterns become part of the system's source of truth)

## Future Phase: Responsive + Site Speed
When doing the responsive pass, also audit and optimize site speed:
- Compress all images (PNG → WebP where possible, optimize JPGs)
- Lazy-load images and videos below the fold (`loading="lazy"`, `preload="none"`)
- Evaluate font loading strategy (subset fonts, `font-display: swap`)
- Minimize unused CSS if file grows large
- Consider video poster attributes instead of auto-loading MP4s
- Run Lighthouse audit and address Core Web Vitals (LCP, CLS, FID)

## Future Phase: Design System
Once the homepage is complete and responsive, extract a formal design system so all future pages are consistent and efficient to build. The homepage sets the tone — the design system codifies it.

### What a design system includes:
1. **Design Tokens** — the foundational values everything is built on:
   - Color palette (primaries, neutrals, accents, semantic colors like success/error)
   - Typography scale (font families, sizes, weights, line-heights, letter-spacing)
   - Spacing scale (already established during the Spacing Standardization phase — carried forward as approved)
   - Border radii, shadows, transitions/animation durations
   - Breakpoints for responsive behavior

2. **Component Library** — reusable UI building blocks extracted from the homepage:
   - Buttons (primary, secondary, ghost — with hover/focus/active states)
   - Cards (case study cards, testimonial cards, feature cards)
   - Section layouts (hero patterns, two-column, full-width CTA bars)
   - Navigation (header, footer, mobile menu)
   - Typography components (section labels, headlines, body text, captions)
   - Media components (video players with overlay/lightbox, image containers)
   - Icons (the custom SVG icon set)
   - Form elements (inputs, textareas — for contact/CTA forms)

3. **Layout Patterns** — documented rules for page structure:
   - Max-width constraints and margin behavior
   - Section spacing rhythm (consistent gaps between sections)
   - Grid/column systems used across sections
   - Content alignment rules (when centered vs left-aligned)

4. **Documentation** — a living reference for building new pages:
   - When to use which component and why
   - Do's and don'ts (e.g., never pair X color with Y background)
   - Naming conventions for CSS classes
   - How to extend the system without breaking consistency

### Implementation approach:
- Audit the completed homepage to catalog every unique style, component, and pattern
- Consolidate redundant/inconsistent styles into a single source of truth
- Extract inline CSS into a structured stylesheet with CSS custom properties (variables)
- Create a simple style guide page (`style-guide.html`) that displays all components in one place for reference
- Document the system so future pages can be built by referencing the guide rather than copying from the homepage

### What makes a good design system:
- **Consistent** — same element looks and behaves the same everywhere
- **Constrained** — limited, intentional choices (not infinite options)
- **Composable** — small pieces combine to build any layout needed
- **Documented** — anyone (or any AI) can use it without guessing
- **Maintainable** — change a token in one place, it updates everywhere

## Future Phase: GitHub Setup & Version Control
Once the homepage is complete (or at a good milestone):
1. Create a GitHub account (github.com)
2. Install GitHub Desktop (optional GUI) or use git CLI
3. Create a new repository on GitHub for Navora Partners website
4. Connect local git repo to GitHub remote (`git remote add origin <url>`)
5. Push code to GitHub (`git push -u origin master`)
6. Learn basics: commits, branches, pull requests, and how to use GitHub as a backup/collaboration tool
7. Optionally set up GitHub Pages for free hosting/preview
