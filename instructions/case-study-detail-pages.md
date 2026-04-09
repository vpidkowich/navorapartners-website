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
- **Hero background image** (file name — a location/action photo or other visual for the hero section)

### Optional but preferred:
- **Case study video transcript** (files with "transcript" in the name — use these as a primary source for additional metrics, operational details, and nuance not in the outline)
- **Client testimonial video transcript** (real quotes from the client — use for the testimonial section)
- **Client quote** (real quote with name/title — if unavailable, mark as "placeholder needed")
- **Additional images** for the story section
- **Timeline** (how long the engagement took to show results)
- **Unique credibility signal** (what makes this brand impressive — SKU count, celebrity endorsements, market position, etc.)

---

## Part 2: Page Structure (Section by Section)

Every detail page follows this exact section order. The HTML template is at `public/case-studies/_template/index.html`. The shared CSS is `public/css/case-study-detail.css`.

### Section 1: Hero
- **Background:** Thumbnail image with dark overlay (`rgba(11,28,46,0.85)`)
- **Badge pill:** Category tag in gold text on translucent background (uppercase)
- **Headline:** Contains the headline stat + locale + company type. The stat/number portion is wrapped in `<span class="highlight">` for gold coloring.
- **NO subtitle paragraph.** The headline speaks for itself. Removing the subtitle keeps the hero tight and above-the-fold.

**Headline rules:**
- MUST contain locale (state, country, or region)
- MUST contain a concrete number (percentage, dollar figure, or multiplier)
- MUST contain a company type descriptor
- Start with "How a [Locale] [Brand Type]..." — this is the standard pattern
- Use an active past-tense verb: "Scaled," "Cut," "Tripled," "Grew," "Reversed"
- Gold-highlight (`<span class="highlight">`) the key numbers — multiple highlights are encouraged for visual impact
- Maximum ~15 words

**Standard formula:** `How a [Locale] [Brand Type] [Action Verb] [Primary Metric] from [Before] to [After]`

**Good examples:**
- "How a California Auto Parts Brand Scaled Revenue <highlight>435%</highlight> from <highlight>$280K</highlight> to <highlight>$1.5M/Month</highlight>"
- "How an Alabama Skincare Brand Scaled from <highlight>$100K</highlight> to <highlight>$600K/Month</highlight>"
- "How a Nevada Puzzle Retailer Cut Acquisition Cost from <highlight>$40</highlight> to <highlight>$15</highlight>"
- "How an Australian Air Purifier Brand Reversed Decline to <highlight>20% YoY Growth</highlight>"

**Bad examples:**
- "California Auto Parts Revenue from $280K to $1.5M/Month" — no verb, sounds like a spreadsheet
- "California Auto Parts Brand Goes from $280K to $1.5M/Month" — "goes" is too casual, no percentage

### Section 2: Download Bar — REMOVED
The download bar has been removed from the template. Do NOT include it on any case study page.
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
- The 3 stats should cover different dimensions (e.g., revenue growth + efficiency metric + revenue milestone)
- Values should be punchy: "435%", "$1.5M", "30%"
- Descriptions should be SHORT — just name what the metric is, don't explain why or how
- Keep descriptions to a brief label/fragment, ending with a period
- Example: "Revenue growth from paid channels."
- Example: "Reduction in new Customer Acquisition Cost (nCAC)."
- Example: "Monthly revenue milestone."
- Do NOT include timelines, methods, or explanations in the stat description — save that for the Results section

**Badge/category tag: REMOVED from hero.**
- Do NOT include the category badge (e.g., "AUTOMOTIVE") in the hero section
- The category only appears on the listing page card, not on the detail page

**Client testimonial video:** Does NOT go in Key Stats. It goes in the **Results section** (Section 7), placed after the gold highlight bar and before the CTA button. See Section 7 for placement details.

### Section 4: The Story
- Cream background
- Label: "FROM CHALLENGES TO SUCCESS"
- Heading: A unique, case-study-specific headline that captures the core narrative of THIS engagement. Do NOT use the template pattern "A Journey of [X]" — every heading must be distinct and memorable. Think of it as a chapter title that could only belong to this story.
  - Good examples: "Unmasking the PMax ROAS Mirage", "The Dashboard Said Growth. The P&L Said Otherwise.", "30,000 SKUs, One Broken Campaign"
  - Bad examples: "A Journey of Reclaiming Growth", "A Journey of Scaling Revenue" — these are generic template fill-ins
- 2-3 body paragraphs telling the narrative
- Photo + blockquote section with gold left border

**Writing the narrative:**

This is the heart of the page. It must feel like a real story, not a marketing brochure.

**Tone:** Confident, specific, empathetic. Write as an expert recounting a successful engagement to a peer. No hype, no fluff, no superlatives. Let the numbers do the heavy lifting. Mirror the tone in `references/Brand Essence - Our Identity.docx` and the Promised Land narrative in `references/Promised Land and Cautionary Tale.docx`.

**Structure the narrative as a SINGLE paragraph (3-4 sentences max):**

This is NOT a multi-paragraph essay. It's a tight, punchy overview that sets the scene and names the problem in one breath. The reader should be able to scan it in 10 seconds and understand the situation.

**Formula:** [Who they are + what they had going for them] + [But here's what was broken] + [The result of that broken thing]

**Example (the standard to follow):**
"This auto parts brand had a strong product catalog and loyal customer base, but their paid media was running on autopilot. All 30,000+ SKUs were crammed into a single campaign with no differentiation between audiences, creative angles, or funnel stages. The result: rising acquisition costs, stagnant revenue, and no visibility into what was actually working."

**What makes this work:**
- Sentence 1: Establishes credibility ("strong catalog, loyal customers") — then pivots with "but"
- Sentence 2: Names the specific operational problem in ICP language ("crammed into a single campaign, no differentiation")
- Sentence 3: States the consequence in business terms ("rising acquisition costs, stagnant revenue")
- Total: 3 sentences. No fluff. The detail comes in the Challenges section.

**What NOT to do:**
- Don't write 3 separate paragraphs — this section is a summary, not the full story
- Don't repeat what will be said in the Challenges section
- Don't use vague language ("struggling to grow") — be operationally specific
- Don't mention Navora in this paragraph — this is about the client's situation before we arrived

**What NOT to write:**
- No generic phrases: "struggling to scale," "needed help with marketing," "wasn't seeing results"
- No competitor bashing: state problems factually, don't blame previous agencies
- No revealing client names unless explicitly approved
- No made-up details — if you don't know something, ask. Better to leave a [PLACEHOLDER] than fabricate.

**The blockquote (CONDITIONAL):**
- If a real client quote is provided, use it exactly as given with proper attribution
- If NO real client quote was provided, OMIT the entire quote block from this section. Do NOT fabricate quotes or use placeholders.

**Navora case study video embed (CONDITIONAL):**
- This is the Navora-produced internal case study video (NOT the client testimonial)
- If a case study video embed code was provided, embed it here after the overview paragraph, before the optional quote block
- **IMPORTANT: Use `youtube-nocookie.com` domain and add `?rel=0` to prevent related videos**
- HTML structure: `<div class="cs-story__video"><iframe src="https://www.youtube-nocookie.com/embed/[VIDEO_ID]?rel=0" title="Case Study Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
- If no embed code was provided, skip this entirely

Note: The client testimonial video (if available) goes in the Key Stats section (see above), NOT here.

### Section 5: Challenges
- **Icon: Warning triangle** — `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22H22L12 2Z" stroke="#0b1c2e" stroke-width="2" stroke-linejoin="round"/><path d="M12 10V14M12 17V18" stroke="#0b1c2e" stroke-width="2" stroke-linecap="round"/></svg>`
- Heading: "Challenges"
- Subheading: A short phrase naming the core challenge (e.g., "Inventory Trapped in a Single Campaign")
- **1 intro paragraph** summarizing the situation (2-3 sentences)
- **3-4 bullet points**, each with a **bold label** followed by a description

**Intro paragraph rules:**
- Sets the stage for the bullets. States the overarching problem in one breath.
- Example: "The brand was running their entire product catalog through a single shopping campaign with no segmentation. This created a cascade of problems that compounded over time, making it nearly impossible to scale efficiently."
- 2-3 sentences max. Don't repeat bullet content — set the context for it.

**Bullet rules:**
- Each bullet starts with a **bold 2-3 word label** followed by a colon, then 1-2 sentences of explanation
- Example: "**No campaign structure:** Thousands of SKUs competing for the same budget with no priority tiers, product grouping, or performance-based segmentation."
- Use operational language the ICP recognizes
- Be specific: "PMax was cannibalizing 40% of branded search budget" not "ads weren't performing"
- Every bullet should make the reader nod and think "we have that problem too"
- Font style must match homepage Growth Strategy paragraph: 22px, regular weight (400), line-height 1.5, `--color-text-secondary`
- The **bold label** uses semibold weight (600) with `--color-text-primary` for differentiation
- The **trailing description text** uses regular weight (400) with `--color-text-secondary` (same as body copy)
- The bold must be noticeably heavier than the description but not jarring

### Section 6: Solution
- **Icon: Lightbulb** — `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8 2 4.5 5.5 4.5 9.5C4.5 13.5 8 16 9.5 18H14.5C16 16 19.5 13.5 19.5 9.5C19.5 5.5 16 2 12 2Z" stroke="#0b1c2e" stroke-width="2" stroke-linejoin="round"/><path d="M9 21H15M10 24H14" stroke="#0b1c2e" stroke-width="2" stroke-linecap="round"/></svg>`
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
- **Icon: Bar chart** — `<svg viewBox="0 0 24 24" fill="none"><path d="M4 20V12M10 20V6M16 20V10M22 20V4" stroke="#0b1c2e" stroke-width="2.5" stroke-linecap="round"/></svg>`
- Heading: "Results"
- Subheading: A short confidence phrase (e.g., "Scaling with Confidence")
- 1-2 summary paragraphs
- Gold highlight bar showing the before→after transformation
- "Want Similar Results? Get Your Growth Strategy" CTA button — **CONDITIONAL: only include if there IS a client quote/testimonial section.** If there is NO testimonial section, omit this CTA button entirely. The Results section flows directly into the Final CTA.

**Results writing rules:**
- Lead with the headline number, then layer in supporting metrics
- Do NOT just repeat the same 3 stats from Key Stats — bring in additional metrics and successes from the outline that weren't featured above (e.g., impression share gains, order volume, timeline milestones, qualitative shifts like "branded to prospecting")
- Include a timeline when available ("within 90 days," "over 6 months")
- End with the qualitative impact: team confidence restored, leadership alignment, etc.
- The gold highlight bar should contain the single most impressive before→after stat

**Client testimonial video (CONDITIONAL):**
- This is the video of the CLIENT speaking about their experience (NOT the Navora-produced case study video)
- Place it in the Results section, after the gold highlight bar and BEFORE the CTA button
- Uses a responsive 16:9 container, max-width 680px, centered, with shadow and border-radius
- HTML structure: `<div class="cs-results__video"><iframe>...</iframe></div>`
- **IMPORTANT: Use `youtube-nocookie.com` domain and add `?rel=0` to prevent related videos**
- If no testimonial video was provided, skip this entirely

### Standard YouTube Embed Code (applies to ALL video embeds on ALL pages)

Every YouTube embed on the site MUST use this exact format:

```html
<iframe
  src="https://www.youtube.com/embed/[VIDEO_ID]?rel=0"
  title="[Descriptive Title]"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>
```

**Parameter explanations:**
- `rel=0` — no related videos at the end

**Do NOT use `youtube-nocookie.com` or `referrerpolicy="no-referrer"` — these break video loading on local file:// development.**

**Video sizing:** The CSS containers (`cs-story__video`, `cs-results__video`) use a responsive 16:9 aspect ratio at `max-width: 680px` with drop shadow and border-radius by default. The agent has liberty to adjust `max-width` on individual embeds if needed to make the video look right within the section — e.g., wider for landscape-heavy content, narrower for talking-head videos.

### Section 8: Testimonial (CONDITIONAL — only include if a real quote exists)
- Warm cream background
- Large blockquote (Roslindale bold)
- Photo (if available) + attribution

**Quote length:** Keep quotes short — 1-2 sentences max, similar in length to the template quote. If the original quote is long, edit it down to the most impactful 1-2 sentences while preserving the client's voice and meaning.

**Photo cropping:** The testimonial image container uses `object-fit: cover` with a fixed height, which can crop faces. If the client's face is cut off, add `style="object-position: top;"` to the `<img>` tag to keep the face in frame.

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
7. [ ] Google Tag Manager (GTM-5DD29LTJ) head script + body noscript present
8. [ ] Google tag / gtag.js (G-D4JNFE89WN) present in head
9. [ ] Tally form lightbox HTML + script present before `</body>`
10. [ ] Headline contains: concrete number + locale + company type
11. [ ] No fabricated quotes — real quotes or `[PLACEHOLDER]`
12. [ ] No fabricated details — real data or `[DETAIL NEEDED]`
13. [ ] Card added to `public/case-studies.html` listing page
14. [ ] Footer links use `../../` prefix
15. [ ] Responsive behavior verified (desktop, tablet, mobile)
16. [ ] All image paths URL-encoded (spaces → `%20`)

---

## Part 5: Writing Quality Standards

### Voice
- **Confident but not arrogant.** We state results factually. We don't say "we crushed it."
- **Specific over general.** "nCAC dropped from $40 to $15 in 90 days" beats "we significantly reduced costs."
- **Empathetic to the ICP.** We describe problems using the language our audience uses in their own heads.
- **Systems-thinking.** We frame solutions as interconnected. Not "we ran better ads" but "we rebuilt the measurement system, restructured the campaigns, and aligned spend to the P&L."

### Banned words
- **Never use "audit" when referring to what Navora did.** We don't do "audits" — we do Growth Strategy sessions, account reviews, or deep analyses. The word "audit" is only acceptable when describing what a previous agency or provider did for the client (e.g., "the previous agency's audit missed...").
- **Never refer to Navora as "an agency."** We are a strategic partner, not a generic agency.

### Punctuation rules
- **Em dashes (—) must be used sparingly.** Maximum 5-10% of sentences. When tempted to use an em dash, use a comma, period, or "and" instead. Em dashes are a crutch that makes writing feel choppy when overused.
- **Good:** "We focused resources on the Most Profitable Brands, ensuring these high-margin lines had 100% coverage."
- **Bad:** "We focused resources on the Most Profitable Brands — ensuring these high-margin lines had 100% coverage."
- Reserve em dashes for moments of genuine dramatic emphasis, not routine clause separation.

### Quote attribution rules
- Attribution shows only the person's role (e.g., "Brand Owner", "Operations Manager")
- Do NOT include the company/brand descriptor below the name. The reader already knows which case study they're reading.
- If no real name is available, use a role title only.

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
- **HTML template:** `public/case-studies/_template/index.html` — the master template for all case study detail pages
- **Shared CSS:** `public/css/case-study-detail.css`
- **Source data for existing cards:** `public/case-studies/Case Study Copy.txt`
