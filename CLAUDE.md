# Navora Partners — Homepage Build

## IMPORTANT: README maintenance rule

There is a comprehensive system documentation file at `FORM-SYSTEM-README.md` that describes the lead capture form system (form submission flow, Attio integration, deal stage webhook, Slack, Google Sheets, Turnstile, etc.).

**Whenever you commit and push changes to any of the following, you MUST also update `FORM-SYSTEM-README.md` in the same commit to accurately reflect the new behavior:**
- `public/js/form-lightbox.js`
- `functions/api/submit-form.js`
- `functions/api/attio-webhook.js`
- `scripts/setup-attio-*.js`
- `scripts/google-sheets-appscript.js`
- `public/lead-confirmed.html`
- Any new file in `functions/api/`, `scripts/`, or related to the form/CRM system
- Env var additions/removals in Cloudflare Pages for the form system
- Changes to Attio setup (new attributes, stages, webhook filters)
- Changes to Slack notification behavior

The README is the source of truth for how the lead capture system works. Future developers (and future Claude sessions) rely on it. Keep it accurate.

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

## Completed Phase: Design System
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

- **Maintainable** — change a token in one place, it updates everywhere

## Completed Phase: Internal Pages

Once the design system is extracted and `style-guide.html` exists, use this workflow to build every internal page. The design system is the source of truth — Figma provides content and layout intent, the design system provides the visual language.

### Prerequisites (completed in Design System phase)
- Shared CSS files exist: `css/variables.css`, `css/components.css`, `css/layout.css`
- Shared HTML partials exist: `partials/head.html`, `partials/nav.html`, `partials/footer.html`
- `style-guide.html` documents all available components
- `index.html` is refactored to use the shared system (no orphaned inline styles)

### Per-Page Workflow (repeat for each internal page)

**Pass 1 — Figma Pull (Claude Code terminal with Figma MCP)**

Pull the page from Figma via the MCP server and save as `[page]-raw.html` (e.g., `about-raw.html`). This file captures layout structure, content, and design intent only. Don't attempt to match the existing site styles — just get the Figma design into code.

**Pass 2 — Reconcile Against Design System (Claude Code)**

Create the production file `[page].html` from the raw pull. Rules:
1. Use `partials/head.html` content for the `<head>` section
2. Use the exact nav from `partials/nav.html`
3. Use the exact footer from `partials/footer.html`
4. Link to `variables.css`, `components.css`, and `layout.css`
5. Reuse existing component classes from `components.css` wherever the raw file has similar elements — don't reinvent styles that already exist
6. Keep the content and general layout intent from the Figma version
7. Match spacing, typography, color, and feel of `index.html`
8. Put any page-specific styles in a new `css/[page].css` file
9. Responsive behavior must match homepage patterns and breakpoints
10. The result should feel like a sibling page of the homepage — same family, same quality

**Pass 3 — Visual QA & Refinement**

Open `[page].html` in the browser alongside the homepage. Check:
- Nav and footer are identical to homepage
- Fonts, colors, and spacing are consistent
- Responsive behavior matches at all breakpoints
- Buttons, links, and interactive elements feel the same
- Overall "weight" and "air" of the page is consistent

Fix any issues, then delete the `-raw` file once the production version is approved.

### Maintaining the Design System During Page Builds
- If a new page introduces a reusable pattern (e.g., a team member card, a pricing table), promote it into `components.css` and document it in `style-guide.html` — don't leave it in the page-specific CSS
- If `css/[page].css` is growing large, that's a sign patterns should be extracted into the shared system
- Every new component added to the system becomes available for all future pages
- Never edit the `-raw` files — if you need a fresh Figma pull, re-pull and overwrite the raw file

## Case Study Workflow

To add a new case study to the website, follow the master workflow at `instructions/add-new-case-study.md`. This covers creating the detail page, listing page card, and optionally the homepage card.

### Supporting instruction files:
- `instructions/case-study-detail-pages.md` — how to write and build detail pages
- `instructions/case-study-listing-cards.md` — how to create and organize listing page cards
- `instructions/success-story-cards.md` — how to create and organize homepage cards
- `instructions/youtube-upload-sub-procedure.md` — auto-upload videos to YouTube during case study builds

### Reference material:
- `references/ICP.docx` — ideal client profile
- `references/Brand Essence - Our Identity.docx` — brand voice and tone
- `references/Promised Land and Cautionary Tale.docx` — narrative framework
- `references/case-studies/` — tone examples from Rankings.io

### Design system (always reference when building pages):
- `public/css/variables.css` — design tokens
- `public/css/components.css` — shared components
- `public/css/layout.css` — layout patterns
- `public/css/case-study-detail.css` — detail page styles

## Completed Phase: Hosting Setup
- [x] GitHub repo live (vpidkowich/navorapartners-website)
- [x] Code pushed to GitHub regularly
- [x] Deployed via Cloudflare Pages with custom domain (navorapartners.com)

## Current Phase: SEO Optimization
Optimize the website based on SEO best practices to improve organic visibility, search rankings, and technical health.

### What SEO optimization includes:
1. **Technical SEO** — site speed, crawlability, indexability, sitemap, robots.txt, canonical tags, structured data (JSON-LD)
2. **On-Page SEO** — title tags, meta descriptions, heading hierarchy, image alt text, internal linking structure
3. **Content SEO** — keyword targeting per page, content gaps, blog/resource strategy
4. **Local/Industry SEO** — schema markup for services, reviews, organization data
5. **Performance** — Core Web Vitals, mobile usability, page load optimization

### Implementation approach:
- Run a full SEO audit of all live pages (homepage, about, careers, case studies listing, 8 detail pages)
- Prioritize fixes by impact (technical blockers first, then on-page, then content)
- Implement JSON-LD schema markup (already planned in CLAUDE.md)
- Review and optimize all title tags and meta descriptions
- Ensure proper internal linking between case study pages, listing page, and homepage
- Validate with Google Search Console, Lighthouse, and rich results testing tools

### Pending: Legal Pages
- `public/terms.html` and `public/privacy.html` exist as placeholder pages
- Content for these pages must be created with the help of legal counsel
- Do NOT generate legal content without explicit approval — only update when real legal copy is provided
