# Plan: Iterative Cleanup of Navora Partners Homepage

## Context
The user had Claude Code generate HTML/CSS from a Figma design via MCP over the weekend. The result is a single `navora-home.html` file (~42KB) with all CSS inline. It's approximately 80% accurate but has formatting, spacing, layout, and image issues that need to be cleaned up section by section. The user is working in Antigravity IDE and wants a structured iteration process.

## Current State
- **Source file**: `navora-home.html` (on Desktop, project directory is empty)
- **Structure**: Single HTML file with 14 sections, all CSS in `<style>` block
- **Issues identified so far** (hero section screenshot):
  - Placeholder divs where real images should go (hero portrait, founder photo, case study images, story card images)
  - Accomplishments stats layout differs from Figma (code: vertical stack; screenshot: appears as 2-col grid)
  - Potential text content mismatches
  - Spacing/padding differences from the Figma design
  - Font rendering — Roslindale font is referenced but no @font-face or import exists

## Step 0: Project Setup
- [x] Move `navora-home.html` from Desktop into `c:\Users\pidvi\OneDrive\Desktop\Navora - Figma and MCP\`
- [x] Create `CLAUDE.md` at project root with project conventions
- [x] Create `images/` folder for future assets
- [x] Replace Roslindale font references with **DM Serif Display** (free Google Font, visually similar serif with editorial feel)
- [x] Add the Google Fonts import for DM Serif Display

### Decisions Made
- **Font**: Use DM Serif Display (free) as Roslindale substitute
- **Images**: Focus on layout/spacing first — placeholder divs stay for now, images added in a later pass
- **File structure**: Move everything into the project folder

### CLAUDE.md Contents
```
# Navora Partners — Homepage Build

## Project Overview
Single-page marketing site for Navora Partners, an e-commerce paid media agency.
Built from a Figma design, currently in cleanup/iteration phase.

## Tech Stack
- Single HTML file with inline CSS (no build tools)
- Fonts: DM Serif Display (heading, substitute for Roslindale), Satoshi (body), Inter Tight (labels), Inria Serif (accents)
- No JavaScript framework — vanilla HTML/CSS
- Target: modern browsers, desktop-first (responsive later)

## Design Reference
- Figma file: [paste Figma URL here when available]
- Color palette: Jade (#024742), Dark BG (#282828), Cream (#faf9f5), Gold (#ffe174), Orange (#ff6b00)

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
- Compare screenshot to current code, fix layout/spacing/content
- User previews in browser and confirms before moving on

## Known Issues
- All images are placeholder divs — real image paths TBD (later phase)
- No responsive/mobile styles yet (desktop-first, responsive is a later phase)
```

## Step 1–14: Section-by-Section Iteration

For each of the 14 sections, the workflow is:

1. **User provides**: Figma screenshot of that section (or describes the issues)
2. **I compare**: Screenshot vs. current HTML/CSS output
3. **I fix**: Layout, spacing, typography, colors, content mismatches
4. **User reviews**: Previews in browser, flags remaining issues
5. **Iterate**: Fix any remaining discrepancies, then move to next section

### Starting with Section 1 & 2 (Header + Hero)
Based on the screenshot already provided, known fixes:
- Swap `--font-heading` from `'Roslindale'` to `'DM Serif Display'`
- Add Google Fonts import for DM Serif Display
- Compare hero layout spacing, badge, heading size, subtitle, buttons, and trust items against screenshot
- Verify accomplishments stats layout (may need grid instead of vertical flex)

### Priority fixes to look for in each section:
- **Layout/grid**: flex vs grid, column counts, alignment
- **Spacing**: padding, margin, gap values matching Figma
- **Typography**: font-family, font-size, line-height, font-weight, letter-spacing
- **Colors**: background, text, border colors matching the design tokens
- **Content**: Text mismatches between code and Figma
- **Borders/shadows/radius**: Subtle visual details
- **Images**: Skipped for now — placeholder divs remain until image pass

## Step 15: Cross-Section Polish
- Verify consistent vertical rhythm between sections
- Check that font imports are all working
- Ensure all CTAs have consistent styling
- Final full-page screenshot comparison

## Step 16: Image Integration (Later Phase)
- User provides real image assets
- Replace placeholder divs with `<img>` tags
- Adjust object-fit, sizing, border-radius as needed

## Step 17: Responsive (Later Phase)
- Not in scope for this iteration — desktop-first cleanup only
- Will be a separate phase after desktop is pixel-perfect

## Verification
- After each section edit, user opens the HTML file in browser and compares visually
- User can share browser screenshots for me to compare against Figma
- Final check: full-page scroll-through comparison with Figma design

## Pending Fix: Hero Background
The hero section `.hero` base background needs to change from `var(--jade)` (#024742) to `#022e2a` to match Version D preview. The lighter jade base is washing out the angular panel gradients, making it look like Version B instead of D.
