# Sub-Procedure: YouTube Video Upload

## Overview

This sub-procedure is triggered during the case study workflow (Phase 2) when a video file is found in the case study folder but no YouTube embed code has been provided. Instead of stopping and waiting for the user to manually upload the video, the agent runs the YouTube upload pipeline directly and retrieves the embed code.

---

## Prerequisites

- **YouTube Upload project** is located at: `C:\Users\pidvi\OneDrive\Desktop\Navora - Youtube Upload Process\`
- A valid `token.json` must exist in that project (YouTube OAuth2 authentication). If it doesn't exist or is expired, ask the user to run `npm run auth` in that project directory and complete the browser authorization.
- The project's `.env` file must contain an `ANTHROPIC_API_KEY` (used for AI-powered title/description generation).

---

## When to Invoke

This sub-procedure applies when **all three conditions** are true:

1. You are in Phase 2 of the case study workflow (`instructions/add-new-case-study.md`)
2. A video file (`.mp4`, `.mov`, `.webm`, `.avi`, `.mkv`) is found in the case study folder
3. No corresponding YouTube embed code was provided (no embed code text in the folder, no embed code pasted by the user)

It applies to **both** video types:
- **Navora case study video** — placed in the "FROM CHALLENGES TO SUCCESS" section
- **Client testimonial video** — placed in the Results section

---

## Video Identification

When scanning the case study folder, identify which video is which:

| Video Type | Filename Pattern |
|-----------|-----------------|
| Navora case study video | Contains "case study", the brand name, or the slug — but NOT "testimonial" |
| Client testimonial video | Contains "testimonial" or a client's first name |

If the filename is ambiguous, ask the user which type it is before proceeding.

---

## Steps

### Step 1: Confirm with the user

Before uploading, ask:

> "I found `[filename]` in the case study folder but no embed code. Would you like me to upload it to YouTube and generate the embed code automatically? This typically takes 10-20 minutes. Or would you prefer to skip the video for this case study?"

Only proceed if the user confirms. If they say skip, omit the video section as normal.

### Step 2: Generate companion JSON

Create a `{basename}.json` file in the **same directory** as the video file. The YouTube CLI reads this automatically.

```json
{
  "content_type": "case-study",
  "draft_title": "[Brand Name] - [Case Study Video / Client Testimonial]",
  "tags_extra": ["navora partners", "ecommerce", "[industry tag]", "[brand name]"],
  "playlist": "Case Studies"
}
```

Fill in the values from what you already know about the case study:
- `draft_title`: Use the brand name and video type (e.g., "Australian Air Purifier - Case Study Video" or "Nick - Client Testimonial")
- `tags_extra`: Include "navora partners", "ecommerce", the industry/category, and the brand name
- `playlist`: Use "Case Studies" for Navora case study videos, "Client Testimonials" for testimonial videos

### Step 3: Run the upload

Execute the following command. Use the Bash tool with a **10-minute timeout** (600000ms) since the process includes uploading and waiting for auto-generated captions:

```bash
cd "/c/Users/pidvi/OneDrive/Desktop/Navora - Youtube Upload Process" && node src/cli.js go "/c/Users/pidvi/OneDrive/Desktop/Navora - Figma and MCP/public/case-studies/[slug]/[video-filename]"
```

Replace `[slug]` and `[video-filename]` with the actual values.

Inform the user while waiting: "Uploading [video name] to YouTube and waiting for auto-generated captions. This typically takes 10-20 minutes."

**Important:** After processing, the YouTube CLI automatically moves the video file and companion JSON from the case study folder to the YouTube project's `processed/` directory. This is expected — the case study page uses a YouTube iframe embed, not a local video file.

### Step 4: Retrieve the embed code

After the command completes successfully:

1. Find the embed HTML file at:
   ```
   C:\Users\pidvi\OneDrive\Desktop\Navora - Youtube Upload Process\processed\{basename}-embed.html
   ```

2. Read the file and extract the YouTube video ID from the iframe `src` attribute. Look for the pattern: `youtube.com/embed/{VIDEO_ID}`

3. Construct the embed code following the case study SOP format (with `?rel=0`):
   ```html
   <iframe src="https://www.youtube.com/embed/{VIDEO_ID}?rel=0" title="[Descriptive title]" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
   ```

   **Note:** The YouTube tool's generated embed does NOT include `?rel=0`. You must add it when constructing the final embed for the case study page.

4. Store this embed code for use in Phase 3 when building the detail page.

### Step 5: Continue the case study workflow

Return to the case study workflow (Phase 2) with the embed code in hand. If both video types needed uploading, repeat Steps 1-4 for each. Then proceed to Phase 3 (building the page).

---

## Error Handling

### Authentication failure

If the command fails with an authentication error (missing `client_secret.json`, expired token, etc.):

> "YouTube authentication needs to be set up or refreshed. Please run `npm run auth` in the YouTube Upload project directory (`C:\Users\pidvi\OneDrive\Desktop\Navora - Youtube Upload Process\`) and complete the browser authorization. Let me know when it's done and I'll retry the upload."

### Upload failure

If the upload fails (network error, API quota exceeded, etc.):

> "The YouTube upload failed with this error: [error message]. Would you like me to retry, or would you prefer to provide the embed code manually later? If you skip for now, I'll build the page without the video and you can add the embed code after."

### Caption timeout

If captions aren't generated within the polling window (up to 20 minutes):

The video IS uploaded — the video ID is available from the upload step output. Tell the user:

> "The video was uploaded successfully (Video ID: {videoId}), but auto-generated captions weren't ready in time. The YouTube metadata (title, description, tags) hasn't been set yet. You can complete this later by running `npm run resume {videoId}` in the YouTube Upload project. In the meantime, I'll use this embed code for the case study page: `https://www.youtube.com/embed/{videoId}?rel=0`"

Extract the video ID from the command output and proceed with building the case study page.

---

## Reference

| Resource | Location |
|----------|----------|
| YouTube Upload project | `C:\Users\pidvi\OneDrive\Desktop\Navora - Youtube Upload Process\` |
| CLI entry point | `src/cli.js` — `go [path]` command |
| Pipeline logic | `src/pipeline.js` — `processVideo()` function |
| Embed output directory | `processed/{basename}-embed.html` |
| Resume command | `npm run resume {videoId}` — for completing metadata after caption timeout |
| Case study embed format | Must use `?rel=0` parameter (see `instructions/case-study-detail-pages.md`) |
