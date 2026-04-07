# SOP: Creating & Organizing Case Study Cards on the Case Studies Main Page

## Purpose

This document instructs an agent on how to create, write, and organize case study cards for the Case Studies listing page (`public/case-studies.html`). These cards are the entry point for every case study — they must stop the scroll, communicate the result, and compel the click.

The audience is direct-to-consumer ecommerce founders and operators, typically running brands between $5M–$15M in revenue, who are experiencing growth plateaus, data confusion, and profit erosion. Refer to `references/ICP.docx` for the full profile.

---

## Part 1: Card Anatomy (HTML Structure)

Each card is an `<a>` tag wrapping the entire card (the whole card is clickable). The structure:

```html
<a href="case-studies/[slug]/" class="cs-card" data-category="[filter-slug]">
  <div class="cs-card-body">
    <span class="cs-card-tag">[Category]</span>
    <h3 class="cs-card-title">[Headline]</h3>
    <p class="cs-card-desc">[Description — 1-2 sentences]</p>
    <div class="cs-card-divider"></div>
    <div class="cs-card-metrics">
      <div class="cs-card-metric">
        <span class="cs-card-metric-label">[Metric 1 Label]</span>
        <span class="cs-card-metric-value">[Metric 1 Value]</span>
      </div>
      <div class="cs-card-metric">
        <span class="cs-card-metric-label">[Metric 2 Label]</span>
        <span class="cs-card-metric-value">[Metric 2 Value]</span>
      </div>
    </div>
    <span class="read-more"><span>Read more</span> <span class="read-more-arrow">&rarr;</span></span>
  </div>
</a>
```

### CSS file
Cards are styled by `public/css/case-studies.css`. Do not add inline styles.

### Thumbnail images — REMOVED
Thumbnail images have been removed from listing page cards. Cards are text-only (tag, headline, description, metrics, read more). Do NOT include a `cs-card-image` div.

---

## Part 2: Writing Card Content

### Headline (h3)

The headline is the most important element. It follows the same rules as the homepage success story cards (see `instructions/success-story-cards.md`):

**Formula:** `[Most Significant Result] + [Company Type Differentiator]`

**Headline principles:**
- Contains a concrete number (dollar figures beat percentages)
- Contains a company type descriptor specific enough to differentiate
- Locale is NOT required on listing card headlines (locale goes on the detail page headline instead)
- No two headlines across the full set sound alike in structure
- Uses ICP language (nCAC, MER, ROI, PMax — not dumbed down)
- Maximum ~12 words

**Examples (from existing cards):**
- "Auto Parts Revenue from $280K to $1.5M/Month" ✓
- "170% Revenue Growth for a High-Ticket Fitness Brand" ✓
- "$98 nCAC Drop for an Australian Air Purifier Brand" ✓
- "Acquisition Cost Cut from $40 to $15 for a Puzzle Retailer" ✓
- "3x Revenue for a Handmade Jewelry Brand" ✓

### Category Tag

A short industry/vertical label displayed as a pastel-colored pill above the title. Colors are auto-generated from the tag text — each unique industry gets a consistent pastel shade.

**CRITICAL: Use standard product categories similar to how Amazon categorizes products.** These should be broad enough to group similar businesses but specific enough to be meaningful. Never use generic labels like "eCommerce" or "Retail."

**How to determine the category:** Read the case study outline to identify what the brand actually sells, then match it to the most appropriate standard product category.

**Standard product categories (use these or similar):**
Automotive, Beauty & Personal Care, Health & Fitness, Health & Wellness Tech, Home Appliances, Home & Bedding, Jewelry & Accessories, Toys & Games, Sports & Outdoors, Pet Supplies, Food & Beverage, Electronics, Baby & Kids, Clothing & Apparel, Supplements & Nutrition, Home & Garden, Office Products, Arts & Crafts

**Bad examples:** eCommerce, Retail, Technology, Fashion, DTC — these describe the business model, not the product category.

**Examples of mapping:**
- Air purifiers → Home Appliances
- RV mattresses → Home & Bedding  
- Neurofeedback device → Health & Wellness Tech
- Tallow skincare → Beauty & Personal Care
- Puzzle retailer → Toys & Games
- Handmade jewelry → Jewelry & Accessories

Use `&amp;` for ampersands in HTML.

### Description (1-2 sentences)

This is NOT a summary of the full case study. It's a teaser that creates curiosity.

**Formula:** `[The specific problem] + [The headline result restated differently]`

**Rules:**
- Maximum 2 sentences
- First sentence names the operational challenge in ICP language
- Second sentence hints at the transformation
- Never reveal the full story — leave the reader wanting to click
- Use the same terminology the ICP uses (PMax, branded search, nCAC, P&L)

### Metrics (2 per card)

Two key stats displayed below a divider line.

**Each metric has:**
- A label (small, muted text) — e.g., "Revenue Growth", "nCAC Drop", "ROI"
- A value (bold, jade color) — e.g., "435%", "$98", "5x"

**Rules:**
- The two metrics should tell complementary parts of the story
- If the headline uses a dollar figure, one metric should use a percentage (and vice versa)
- Include a time indicator when available (e.g., "90 Days" as a value)
- Keep labels under 3 words
- Keep values punchy — "$40 → $15" or "3x" or "500%"

---

## Part 3: Organizing Cards on the Page

### Grid Layout
Cards display in a 3-column grid on desktop, 2-column on tablet, 1-column on mobile.

### Sequencing Principles

Follow the same row-pairing logic as the homepage success story cards (see `instructions/success-story-cards.md` Part 2), adapted for a 3-column grid:

**Row-level rule: No two adjacent cards should tell the same type of story.**

**Story types:**
- Revenue growth / scaling (big dollar figures, percentage growth)
- Efficiency / cost reduction (nCAC drops, ROI improvements)
- Data/tracking fix (fake data exposed, broken tracking repaired)
- Structural simplification (account cleanup, consolidation)

**Vertical sequencing:**
- **Row 1:** The most impressive transformations. Dollar figures and large multipliers. The "holy shit" row.
- **Subsequent rows:** Alternate between scaling stories, surgical fixes, and efficiency wins.
- **Final row:** "Less is more" stories that reinforce strategic thinking.

**Diversity rules:**
- Spread locales across the grid (don't cluster all US stories together)
- Spread product categories (don't put two skincare brands adjacent)
- Vary headline framing (dollar-to-dollar, multiplier, percentage, cost reduction)

---

## Part 4: Adding a New Card

### Checklist

When adding a new case study card:

1. [ ] Detail page exists at `public/case-studies/[slug]/index.html`
2. [ ] Card HTML added to `public/case-studies.html` inside `.cs-grid`
3. [ ] Headline contains: concrete number + company type (no locale needed on listing cards)
4. [ ] Description is 1-2 sentences max, uses ICP language
5. [ ] Two complementary metrics with short labels and punchy values
6. [ ] Category tag is from the standard list
7. [ ] Card placement follows sequencing rules (not adjacent to same story type)
8. [ ] GTM snippet is present on the detail page

---

## Part 5: Reference Files

- **Card writing rules:** `instructions/success-story-cards.md`
- **ICP profile:** `references/ICP.docx`
- **Brand voice:** `references/Brand Essence - Our Identity.docx`
- **Current listing page:** `public/case-studies.html`
- **Card CSS:** `public/css/case-studies.css`
- **Source data for existing cards:** `public/case-studies/Case Study Copy.txt`
