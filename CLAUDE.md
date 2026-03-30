# Navora Partners — Homepage Build

## Project Overview
Single-page marketing site for Navora Partners, an e-commerce paid media agency.
Built from a Figma design. Homepage is complete and responsive.

## Tech Stack
- Single HTML file with inline CSS (no build tools)
- Fonts: Roslindale (heading, loaded via @font-face from fonts/roslindale/), Satoshi (body), Inter Tight (labels), Inria Serif (accents), Excalifont (How We Help descriptions)
- No JavaScript framework — vanilla HTML/CSS
- Responsive: desktop, tablet (portrait + landscape), mobile
- Videos hosted externally (YouTube/Vimeo TBD) — no mp4s in repo

## Design Reference
- Figma file: https://www.figma.com/design/GYND5aAIndruM8wGLmljVo/Navora-Design?node-id=47-3&t=W8oOjKQfBGKHJG6M-4
- Color palette: Jade (#024742), Dark Navy (#0b1c2e), Dark BG (#282828), Cream (#faf9f5), Gold (#ffe174), Orange (#ff6b00)
- Reference site for button hover effects: rankings.io (gradient slide left-to-right, arrow shifts right, 400ms)

## Section Map (14 sections)
1. Header (sticky nav, hamburger on tablet/mobile)
2. Hero (image hidden in portrait tablet/mobile)
3. Accomplishments (stats bar)
4. Why Navora Partners
5. Case Studies
6. Who We Help
7. Pillars / How We Help (ring diagram on desktop, horizontal tabs on mobile)
8. Truth
9. Growth Strategy
10. Process (dashed path on desktop, stacked on mobile)
11. Founder Access
12. Testimonial Carousel (fixed-height slides)
13. Final CTA
14. Footer

## Responsive Breakpoints
- **Desktop**: base styles (spacing tokens scaled 0.9× from 8px grid)
- **Tablet** (max-width: 1200px): original spacing restored, hamburger nav
- **Tablet portrait** (max-width: 1200px + orientation: portrait): hero image hidden, stats stacked, content centered
- **Mobile** (max-width: 768px): single-column layouts, CTA in hamburger menu
- **Small mobile** (max-width: 480px): further font-size reductions

## Spacing System
Desktop spacing tokens are scaled 0.9× from an 8px grid. Original values are restored at the 1200px tablet breakpoint.

| Token | Desktop (0.9×) | Tablet/Mobile (original) |
|-------|---------------|-------------------------|
| 2xs | 4px | 4px |
| xs | 7px | 8px |
| sm | 14px | 16px |
| md | 22px | 24px |
| lg | 29px | 32px |
| xl | 43px | 48px |
| 2xl | 58px | 64px |
| 3xl | 72px | 80px |
| 4xl | 86px | 96px |
| 5xl | 101px | 112px |

## Completed Phases
- [x] Section-by-section Figma cleanup (all 14 sections)
- [x] 8px grid spacing standardization
- [x] Site speed optimizations (WebP images, lazy loading, preconnect, font-display: swap)
- [x] Responsive pass (tablet portrait/landscape, mobile, small mobile)
- [x] Zoom 0.9 removal (replaced with properly scaled CSS values)
- [x] CLAUDE.md cleanup

## Future Phase: JSON-LD Schema Markup
Add structured data for SEO rich snippets. This is a `<script type="application/ld+json">` block in `<head>` — no visual impact, no functional impact, works on any host (Netlify, Sevalla, Framer, static).

### Schemas to implement:
1. **Organization** — business name, logo, URL, social profiles
2. **ProfessionalService** — agency type, services offered, service area
3. **Service** (multiple) — paid media management, growth strategy, creative strategy, full-funnel optimization
4. **AggregateRating** — the "4.8/5 based on client feedback" from the hero
5. **Review** — individual testimonials from the carousel (Tammy, Nick, etc.)
6. **FAQPage** — if/when an FAQ section is added

### Implementation approach:
- Add all schemas in a single `<script type="application/ld+json">` block using `@graph` format
- Validate with Google's Rich Results Test (search.google.com/test/rich-results)
- Test with Schema.org validator (validator.schema.org)

## Future Phase: Design System
Once the homepage is complete and responsive, extract a formal design system so all future pages are consistent and efficient to build. The homepage sets the tone — the design system codifies it.

### What a design system includes:
1. **Design Tokens** — the foundational values everything is built on:
   - Color palette (primaries, neutrals, accents, semantic colors like success/error)
   - Typography scale (font families, sizes, weights, line-heights, letter-spacing)
   - Spacing scale (carried forward from the spacing standardization phase)
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

## Future Phase: GitHub & Hosting Setup (Partially Complete)
GitHub repo is live and code is being pushed regularly.

### Completed:
- [x] GitHub account created
- [x] Repository created on GitHub (vpidkowich/navorapartners-website)
- [x] Local git repo connected to GitHub remote
- [x] Code pushed to GitHub regularly
- [x] GitHub Pages set up for preview (vpidkowich.github.io)

### Remaining:
1. Learn branching, pull requests, and collaboration workflows
2. Deploy to Sevalla.com (primary production host — replaces GitHub Pages)

### Sevalla.com Deployment
Sevalla (sevalla.com) will be the primary hosting platform for the live site. GitHub Pages remains as a preview/staging tool.
- Read Sevalla knowledge base for static site deployment steps
- Connect GitHub repo to Sevalla for automatic deploys
- Configure custom domain (navorapartners.com) on Sevalla
- Set up SSL/HTTPS
- Verify site performance and CDN configuration
