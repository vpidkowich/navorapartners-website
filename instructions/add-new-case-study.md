# Workflow: Adding a New Case Study

## Overview

This is the master workflow for adding a new case study to the Navora Partners website. It covers creating the detail page, adding the card to the Case Studies listing page, and optionally adding a card to the homepage "More Success Stories" section.

This workflow is designed to be triggered by a simple prompt. The person provides assets in a folder and a prompt — the agent handles everything else.

---

## How to Trigger This Workflow

### Step 1: Prepare the case study folder

Create a folder at `public/case-studies/[slug]/` where `[slug]` is a lowercase, hyphenated descriptor (e.g., `auto-parts-revenue`, `tallow-skincare`).

Add the following files to that folder:

| File | Required? | Notes |
|------|-----------|-------|
| Case study outline | **Required** | Google Doc (.docx) or Word doc with the full case study details |
| Client testimonial video embed code | Optional | Embed code for the client speaking about their experience. Placed in Key Stats section. |
| Navora case study video embed code | Preferred | Embed code for the Navora-produced internal case study video. Placed in FROM CHALLENGES TO SUCCESS section. |
| Transcripts | Preferred | Files with "transcript" in the name — from case study video and/or testimonial |
| Client quotes file | Preferred | Select quotes from client contacts, with names/titles |
| Thumbnail image | Optional | No longer used on listing page cards. May still be useful as a detail page asset. |
| Client headshot | Optional | Photo of the client contact for the testimonial section |
| Client logo | Optional | Logo image for attribution |
| Location/action photo | Optional | Photo of client location or representing their business/niche |
| Graphics/screenshots | Optional | Hand-made graphs, account screenshots, anything eye-catching from the video |

### Step 2: Submit the prompt

Open the project in your IDE with Claude Code and submit:

> "We're going to add a new Case Study **[with/without]** the homepage card. Please run the set of instructions for accomplishing this and see all the attached assets needed to complete this task within the folder titled **[FOLDER NAME]**."

---

## Agent Instructions

When this workflow is triggered, follow these steps in order.

### Phase 1: Read Reference Material

Read these files before doing anything else:

1. **This file** — `instructions/add-new-case-study.md`
2. **Detail page SOP** — `instructions/case-study-detail-pages.md`
3. **Listing card SOP** — `instructions/case-study-listing-cards.md`
4. **Homepage card SOP** — `instructions/success-story-cards.md` (only if homepage card was requested)
5. **ICP profile** — `references/ICP.docx`
6. **Brand voice** — `references/Brand Essence - Our Identity.docx`
7. **Narrative framework** — `references/Promised Land and Cautionary Tale.docx`
8. **Tone examples** — Read 2-3 files from `references/case-studies/` to absorb the case study writing tone
9. **Design system** — `public/css/case-study-detail.css`, `public/css/variables.css`, `public/css/components.css`

Then read the contents of the case study folder:
- The case study outline document (the .docx file)
- Any transcript files (files with "transcript" in the name)
- Any client quotes files
- Note which image/video assets are available

### Phase 2: Inventory Assets & Ask Clarifying Questions

Before building anything, the agent MUST inventory what's in the folder and report what's present vs missing. Then ask about every gap.

**Step 1: Report the asset inventory**

List what was found in the case study folder and flag what's missing:

| Asset | Status |
|-------|--------|
| Case study outline (.docx) | ✅ Found / ❌ Missing |
| Navora case study video embed code | ✅ Found / ❌ Missing |
| Client testimonial video embed code | ✅ Found / ❌ Missing |
| Transcripts (files with "transcript" in name) | ✅ Found / ❌ Missing |
| Client quotes file | ✅ Found / ❌ Missing |
| Thumbnail image (optional) | ✅ Found / ❌ Not provided |
| Client headshot | ✅ Found / ❌ Missing |
| Client logo | ✅ Found / ❌ Missing |
| Location/action photo | ✅ Found / ❌ Missing |
| Graphics/screenshots | ✅ Found / ❌ Missing |

Present this table to the person so they can see what's there and what's not.

**Step 2: Ask about every missing asset**

For EACH missing item, ask: **"Did you mean to skip [item], or did you just forget to add it?"**

Only omit the section from the page if the person confirms they want to skip it. If they forgot, wait for them to provide it before building.

Specific questions per item:
- **No thumbnail?** → Thumbnails are no longer required for listing page cards. Only ask if a thumbnail is needed for other purposes (e.g., detail page hero background).
- **No client headshot?** → "Did you mean to skip the client headshot, or did you forget? If skipped, the quote block won't have a photo."
- **No client logo?** → "Did you mean to skip the client logo, or did you forget? If skipped, attribution will be text-only."
- **No location/action photo?** → "Did you mean to skip the location/action photo, or did you forget? This would be used in the story section alongside the quote."
- **No client testimonial video embed code?** → "Did you mean to skip the client testimonial video, or did you forget? If skipped, the testimonial video in the Key Stats section will be omitted."
- **No Navora case study video embed code?** → "Did you mean to skip the Navora case study video, or did you forget to add the embed code? If skipped, the video in the FROM CHALLENGES TO SUCCESS section will be omitted."
- **No client quotes?** → "Did you mean to skip client quotes, or did you forget? If skipped, the quote block and testimonial section will be omitted entirely (not faked)."
- **No graphics/screenshots?** → "Did you mean to skip graphics/screenshots, or did you forget? These add visual interest to the page."

**Step 3: Hero background image decision**

If no custom hero background image was provided (location photo or action shot):
- Ask: "There's no custom hero background image. Should I use the case study video thumbnail as the hero background, or do you have an industry-specific image you'd like to use?"

**Step 4: Ask the category question**

"What product category should this case study be tagged with?"
Provide examples from the standard list (Automotive, Beauty & Personal Care, Health & Fitness, etc.) and reference `instructions/case-study-listing-cards.md` for the full category rules.

**Step 5: Confirm the headline**

Draft the proposed headline following the SOP rules (concrete number + locale + company type) and present it for approval before proceeding.

Do NOT proceed to building until all questions are answered.

### Phase 3: Build the Case Study

#### 3a. Organize the folder

Ensure all assets in `public/case-studies/[slug]/` are properly named:
- Thumbnail: `thumbnail.webp` (or `.png`/`.jpg` if webp not available)
- URL-encode any filenames with spaces when referencing in HTML

#### 3b. Create the detail page

Create `public/case-studies/[slug]/index.html` following the instructions in `instructions/case-study-detail-pages.md`.

Key requirements:
- Use the HTML template structure (hero, download bar, key stats, story, challenges, solution, results, testimonial, final CTA, footer)
- All CSS links use `../../css/` prefix
- All shared asset links use `../../` prefix
- Local assets (in the same folder) use no prefix
- Nav has `nav-active` on "Results"
- GTM head + body snippets are present
- Headline contains: concrete number + locale + company type
- Gold-highlighted text wraps the most impressive stat
- **Do NOT fabricate quotes** — use real quotes from the provided materials or mark as `[CLIENT QUOTE NEEDED]`
- **Do NOT fabricate details** — use real data from the outline or mark as `[DETAIL NEEDED]`
- Reference the design system throughout (use CSS custom properties, shared component classes)

#### 3c. Add the listing page card

Add a card to `public/case-studies.html` inside the `.cs-grid` div, following the instructions in `instructions/case-study-listing-cards.md`.

Key requirements:
- Card links to `case-studies/[slug]/`
- No thumbnail image on listing cards (thumbnails have been removed)
- Headline follows the SOP rules (number + company type; locale is NOT required on listing cards)
- Description is 1-2 sentences max
- Two complementary metrics
- Card placement follows the sequencing rules (not adjacent to same story type)

#### 3d. Homepage card (only if requested in the prompt)

If the prompt specified "with the homepage card":

1. Draft the card content following `instructions/success-story-cards.md`:
   - Headline (scroll-stopper with number + company type)
   - 4 bullets (industry+locality, credibility signal, challenge, secondary proof)

2. Draft the proposed ordering of ALL cards in the "More Success Stories" section, including the new card. Explain your rationale for the placement using the row-pairing and sequencing principles from the SOP.

3. **PRESENT THE DRAFT TO THE PERSON FOR APPROVAL.** Show:
   - The proposed card content (headline + 4 bullets)
   - The proposed card order (which row, left or right, and why)
   - Wait for approval or revision before making any changes to the homepage

4. Only after approval: add the card to `public/index.html` in the `.stories-grid` section and update the card ordering as approved.

### Phase 4: Final Checks

Before committing:

- [ ] Detail page loads correctly (check all image paths)
- [ ] Listing page card links to the detail page
- [ ] GTM snippet present on detail page (head + body)
- [ ] No `[PLACEHOLDER]`, `[DETAIL NEEDED]`, or `[CLIENT QUOTE NEEDED]` markers remain (unless explicitly approved)
- [ ] All CSS references use design system tokens
- [ ] Nav has `nav-active` on "Results"
- [ ] Footer links use `../../` prefix correctly
- [ ] Responsive behavior works (desktop, tablet, mobile)
- [ ] If homepage card was added: ordering follows SOP and was approved by the person

### Phase 5: Commit & Push

Stage all new/modified files and commit with a descriptive message:

```
Add [Case Study Name] case study — [headline stat]

- Detail page: public/case-studies/[slug]/index.html
- Card added to case studies listing page
- [If applicable] Homepage card added to More Success Stories
```

Push to the remote repository.

---

## Reference File Index

| Purpose | File Path |
|---------|-----------|
| This workflow | `instructions/add-new-case-study.md` |
| Detail page writing & structure | `instructions/case-study-detail-pages.md` |
| Listing page card rules | `instructions/case-study-listing-cards.md` |
| Homepage card rules | `instructions/success-story-cards.md` |
| ICP profile | `references/ICP.docx` |
| Brand voice & tone | `references/Brand Essence - Our Identity.docx` |
| Narrative framework | `references/Promised Land and Cautionary Tale.docx` |
| Tone examples | `references/case-studies/*.docx` |
| Detail page CSS | `public/css/case-study-detail.css` |
| Design tokens | `public/css/variables.css` |
| Shared components | `public/css/components.css` |
| Layout patterns | `public/css/layout.css` |
| Listing page | `public/case-studies.html` |
| Homepage | `public/index.html` |
| Existing card data | `public/case-studies/Case Study Copy.txt` |
