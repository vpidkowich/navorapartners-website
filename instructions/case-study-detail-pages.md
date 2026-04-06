# SOP: Writing & Building Case Study Detail Pages

## Purpose

This document instructs an agent on how to write, structure, and build individual case study detail pages for the Navora Partners website. Each page tells the full story of a client engagement — the problem, the approach, and the measurable result — in a way that builds trust and moves the reader toward a consultation.

The audience is direct-to-consumer ecommerce founders and operators, typically running brands between $5M–$15M in revenue. Refer to `references/ICP.docx` for the full profile and `references/Brand Essence - Our Identity.docx` for brand voice.

---

## Part 1: Required Inputs (The Case Study Outline)

Before building a detail page, the following must be provided. If any item is missing, ask for it before proceeding.

### Required:
- **Client descriptor** (anonymized brand type, e.g., "DTC auto parts retailer")
- **Industry / Category tag** (e.g., "eCommerce", "Beauty & Wellness")
- **Locale** (city, state/country — MUST appear in the headline)
- **Headline stat** (the scroll-stopper number, e.g., "435% revenue growth")
- **3 key metrics** with labels and values
- **The problem** (2-4 sentences: what was broken, what wasn't working, in operational detail)
- **What Navora did** (2-4 numbered steps: specific actions taken, not generic marketing speak)
- **The results** (2-3 sentences: the before/after transformation with numbers)
- **Thumbnail image** (file name, or "use video thumbnail")

### Optional but preferred:
- **Client quote** (real quote with name/title — if unavailable, mark as "placeholder needed")
- **Additional images** for the story section
- **Timeline** (how long the engagement took to show results)
- **Unique credibility signal** (what makes this brand impressive — SKU count, celebrity endorsements, market position, etc.)

---

## Part 2: Page Structure (Section by Section)

Every detail page follows this exact section order. The HTML template is at `public/case-studies/auto-parts-revenue/index.html`. The shared CSS is `public/css/case-study-detail.css`.

### Section 1: Hero
- **Background:** Thumbnail image with dark overlay (`rgba(11,28,46,0.85)`)
- **Badge pill:** Category tag in gold text on translucent background (uppercase)
- **Headline:** Contains the headline stat + locale + company type. The stat/number portion is wrapped in `<span class="highlight">` for gold coloring.
- **Subtitle:** 1-2 sentences that expand the headline. States the specific problem and hints at the approach. Written in third person ("we transformed..." not "they transformed...").

**Headline rules (same as card headlines but can be slightly longer):**
- MUST contain locale (state, country, or region)
- MUST contain a concrete number
- MUST contain a company type descriptor
- Gold-highlighted text should be the most impressive number or transformation
- Maximum ~15 words

**Example:** "How a <span class="highlight">California</span> Auto Parts Brand Scaled Revenue <span class="highlight">435%</span> from <span class="highlight">$280K to $1.5M/Month</span>"

### Section 2: Download Bar
- Jade background, overlaps the hero via negative margin
- Left side: "Download the full case study" heading + "Get the detailed PDF version. No email required." subtitle
- Right side: Gold "DOWNLOAD PDF" button
- **Note:** If no PDF exists, the button links to `#` as placeholder. Flag this to the reviewer.

### Section 3: Key Stats & Results
- Cream background, centered
- Label: "RESULTS THAT SPEAK FOR THEMSELVES"
- Heading: "Key Stats & Results"
- 3 stat cards in a row, each with:
  - Icon in jade-tinted box (use SVGs from the template — star, trending arrow, target)
  - Large stat value (Roslindale bold, jade color)
  - 1-sentence description of what that stat means

**Rules:**
- The 3 stats should cover different dimensions (e.g., revenue growth + efficiency metric + timeline)
- Values should be punchy: "435%", "$1.5M/mo", "90 Days"
- Descriptions should be one line, plain language

### Section 4: The Story
- Cream background
- Label: "CLIENT CASE STUDY"
- Heading: "A Journey of [Transformation Type]" — e.g., "A Journey of Restructuring Growth"
- 2-3 body paragraphs telling the narrative
- Photo + blockquote section with gold left border

**Writing the narrative:**

This is the heart of the page. It must feel like a real story, not a marketing brochure.

**Tone:** Confident, specific, empathetic. Write as an expert recounting a successful engagement to a peer. No hype, no fluff, no superlatives. Let the numbers do the heavy lifting. Mirror the tone in `references/Brand Essence - Our Identity.docx` and the Promised Land narrative in `references/Promised Land and Cautionary Tale.docx`.

**Structure the narrative as:**
1. **The context** (1 paragraph) — Who is the brand? What's their market? What makes them impressive? This paragraph should make the reader think "that sounds like my situation" or "they work with serious companies."
2. **The pain** (1 paragraph) — What specifically wasn't working? Name the operational problem using ICP language (PMax cannibalization, ROAS mirage, broken tracking, nCAC inflation, etc.). The reader should see their own pain reflected here.
3. **The turning point** (1 paragraph, optional) — When/how they engaged Navora. Keep this brief — the reader doesn't need a sales story.

**What NOT to write:**
- No generic phrases: "struggling to scale," "needed help with marketing," "wasn't seeing results"
- No competitor bashing: state problems factually, don't blame previous agencies
- No revealing client names unless explicitly approved
- No made-up details — if you don't know something, ask. Better to leave a [PLACEHOLDER] than fabricate.

**The blockquote:**
- If a real client quote is provided, use it exactly as given
- If no quote is available, write `[CLIENT QUOTE NEEDED]` as placeholder — do NOT fabricate quotes
- Attribution: client name and title if approved, otherwise "Brand Founder" or similar

### Section 5: Challenges
- Gold circle icon (target/crosshair SVG)
- Heading: "Challenges"
- Subheading: A short phrase naming the core challenge (e.g., "Inventory Trapped in a Single Campaign")
- 3-4 bullet points, each describing one specific challenge

**Bullet rules:**
- Each bullet is 1-2 sentences max
- Use operational language the ICP recognizes
- Be specific: "PMax was cannibalizing 40% of branded search budget" not "ads weren't performing"
- Every bullet should make the reader nod and think "we have that problem too"

### Section 6: Solution
- Gold circle icon (lightbulb SVG)
- Heading: "Solution"
- Subheading: A short phrase naming the strategic approach (e.g., "A Full-Funnel Restructuring")
- 4 numbered steps, each with a bold title and 1-2 sentence description

**Solution writing rules:**
- Each step should name a specific, concrete action Navora took
- Use Navora's actual methodology language where possible
- Steps should flow logically: diagnosis → restructure → optimize → scale
- Avoid vague steps like "optimized campaigns" — say what was actually done
- If you don't know the specific approach, use [DETAIL NEEDED] placeholder

### Section 7: Results
- Gold circle icon (trophy SVG)
- Heading: "Results"
- Subheading: A short confidence phrase (e.g., "Scaling with Confidence")
- 1-2 summary paragraphs
- Gold highlight bar showing the before→after transformation
- "START YOUR PROJECT" CTA button

**Results writing rules:**
- Lead with the headline number, then layer in supporting metrics
- Include a timeline when available ("within 90 days," "over 6 months")
- End with the qualitative impact: team confidence restored, leadership alignment, etc.
- The gold highlight bar should contain the single most impressive before→after stat

### Section 8: Testimonial (CONDITIONAL — only include if a real quote exists)
- Warm cream background
- Large blockquote (Roslindale bold)
- Photo (if available) + attribution

**CRITICAL: If no real client quote or testimonial was provided, OMIT this entire section from the page. Do NOT fabricate quotes. Do NOT use placeholder text. Simply skip this section — the page flows from Results directly to Final CTA.**

The same rule applies to the blockquote in the Story section (Section 4) — if no real quote was provided, omit the quote block entirely rather than inserting a fake one.

### Section 9: Final CTA
- Jade background, centered
- Heading: "Ready to Write Your Success Story?"
- Subtitle encouraging the reader to take the next step
- Gold button: "Get My Free Growth Strategy"

### Section 10: Footer
- Exact shared footer from `partials/footer.html`
- Adjust paths for nested directory (`../../` prefix)

---

## Part 3: File Organization

Each case study lives in its own folder:

```
public/case-studies/[slug]/
├── index.html          ← the detail page
├── thumbnail.webp      ← card image (required)
├── [video].mp4         ← case study video (if available)
├── [other assets]      ← additional images, transcripts, etc.
```

### Naming the slug:
- Lowercase, hyphenated
- Descriptive but short: `auto-parts-revenue`, `tallow-skincare`, `puzzle-retailer`
- Include locale if it helps: `australian-air-purifier`

---

## Part 4: Technical Checklist

Before committing a new case study detail page:

1. [ ] Folder created at `public/case-studies/[slug]/`
2. [ ] `index.html` uses the shared template structure
3. [ ] Links CSS: `../../css/case-study-detail.css` (plus variables, components, layout)
4. [ ] Nav has `nav-active` on "Results"
5. [ ] All asset paths use `../../` prefix for shared resources
6. [ ] Local assets (thumbnail, video) referenced without path prefix (same folder)
7. [ ] GTM head + body snippets present
8. [ ] Headline contains: concrete number + locale + company type
9. [ ] No fabricated quotes — real quotes or `[PLACEHOLDER]`
10. [ ] No fabricated details — real data or `[DETAIL NEEDED]`
11. [ ] Card added to `public/case-studies.html` listing page
12. [ ] Footer links use `../../` prefix
13. [ ] Responsive behavior verified (desktop, tablet, mobile)
14. [ ] All image paths URL-encoded (spaces → `%20`)

---

## Part 5: Writing Quality Standards

### Voice
- **Confident but not arrogant.** We state results factually. We don't say "we crushed it."
- **Specific over general.** "nCAC dropped from $40 to $15 in 90 days" beats "we significantly reduced costs."
- **Empathetic to the ICP.** We describe problems using the language our audience uses in their own heads.
- **Systems-thinking.** We frame solutions as interconnected — not "we ran better ads" but "we rebuilt the measurement system, restructured the campaigns, and aligned spend to the P&L."

### Tone references
- Read `references/Brand Essence - Our Identity.docx` for brand personality
- Read `references/Promised Land and Cautionary Tale.docx` for narrative framework
- Read 2-3 files in `references/case-studies/` to see the Rankings.io tone we admire — then adapt it to our ICP (DTC ecom, not law firms)

### What makes a great Navora case study:
1. The reader sees their own pain in the challenge section
2. The solution sounds smart and systematic, not lucky
3. The results feel inevitable in hindsight — "of course that worked"
4. The locale and industry specificity make it feel real, not templated
5. The numbers are precise and verifiable
6. Nothing reads as fabricated or exaggerated

---

## Part 6: Reference Files

- **Case study outline inputs:** Provided per-engagement (Google Doc or text file)
- **Card writing rules:** `instructions/success-story-cards.md`
- **Card listing rules:** `instructions/case-study-listing-cards.md`
- **ICP profile:** `references/ICP.docx`
- **Brand voice:** `references/Brand Essence - Our Identity.docx`
- **Narrative framework:** `references/Promised Land and Cautionary Tale.docx`
- **Reference case studies (tone examples):** `references/case-studies/*.docx`
- **HTML template:** `public/case-studies/auto-parts-revenue/index.html`
- **Shared CSS:** `public/css/case-study-detail.css`
- **Source data for existing cards:** `public/case-studies/Case Study Copy.txt`
