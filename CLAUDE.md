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

## Future Phase: Responsive + Site Speed
When doing the responsive pass, also audit and optimize site speed:
- Compress all images (PNG → WebP where possible, optimize JPGs)
- Lazy-load images and videos below the fold (`loading="lazy"`, `preload="none"`)
- Evaluate font loading strategy (subset fonts, `font-display: swap`)
- Minimize unused CSS if file grows large
- Consider video poster attributes instead of auto-loading MP4s
- Run Lighthouse audit and address Core Web Vitals (LCP, CLS, FID)
