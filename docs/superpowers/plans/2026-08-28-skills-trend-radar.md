# Claude Code Skills Trend Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a weekly, self-updating Artifact dashboard that ranks the most popular Claude Code skills/plugins (dev + video-production focus), driven by a cloud scheduled agent — no server, no database.

**Architecture:** A single self-contained prompt (`prompts/weekly-trend-radar.md`) is the operative artifact. It gets pasted verbatim into a `/schedule` cloud routine. Each weekly run: the cloud agent searches sources live (GitHub Search API + WebSearch for marketplace/aggregator listings), ranks results, reads last week's snapshot out of the currently-published Artifact's embedded JSON, computes movement, and redeploys the same Artifact URL with the new table + updated JSON. The local git repo only holds the spec, the prompt text, and a README pointing at the live URL — it is documentation, not runtime dependency (the cloud agent cannot read local files).

**Tech Stack:** Claude cloud scheduled agent (`/schedule` skill → CronCreate), Claude Artifact (published HTML page, own tools: publish/read), WebFetch/WebSearch (GitHub Search API + marketplace discovery). No app code, no server, no database.

**Spec:** [docs/superpowers/specs/2026-08-28-skills-trend-radar-design.md](../specs/2026-08-28-skills-trend-radar-design.md)

## Global Constraints

- No separate database or server — history lives inside the Artifact page (rolling window of last 8 weekly snapshots, embedded as JSON).
- Ranking metric is absolute popularity (stars/downloads), not week-over-week delta.
- Categories: dev (code/mini-apps/bots) and video production only; everything else is dropped from the top list.
- Top list size: 15-20 items.
- A source failing must not abort the run — skip it, note it in the footer, continue with the rest.
- Schedule: weekly, Tuesday 09:00 UTC (12:00 Moscow).
- First run is manual (not on the schedule) and must be eyeballed for plausibility before the cron is enabled.

---

## File Structure

- `prompts/weekly-trend-radar.md` — the exact, self-contained instruction text used both for the manual first run and as the `/schedule` routine's stored prompt. This is the single source of truth for what the agent does every week.
- `README.md` — human-facing pointer: what this project is, link to the spec, link to the prompt file, the live Artifact URL (filled in after Task 2), and the schedule ID (filled in after Task 3).
- `docs/superpowers/specs/2026-08-28-skills-trend-radar-design.md` — already exists (design).
- `docs/superpowers/plans/2026-08-28-skills-trend-radar.md` — this file.

---

### Task 1: Write the repeatable weekly prompt

**Files:**
- Create: `prompts/weekly-trend-radar.md`

**Interfaces:**
- Produces: the exact prompt text later tasks paste into a manual run (Task 2) and into the `/schedule` routine (Task 3). Contains an `{{ARTIFACT_URL}}` placeholder that Task 3 replaces with the real URL obtained from Task 2.

- [ ] **Step 1: Write the prompt file**

```markdown
# Weekly Claude Code Skills Trend Radar — Agent Instructions

Run this end-to-end, unattended. Produce one outcome: the Artifact at
{{ARTIFACT_URL}} is redeployed with this week's data. No other output is
needed.

## 1. Collect

Query these sources. If a source fails or returns nothing usable, skip it
and add its name to a `skipped` list — do not stop the run.

- GitHub Search API (no auth needed, public search):
  - `https://api.github.com/search/repositories?q=topic:claude-code-skill&sort=stars&order=desc&per_page=50`
  - `https://api.github.com/search/repositories?q=topic:claude-skill&sort=stars&order=desc&per_page=50`
  - `https://api.github.com/search/repositories?q=topic:claude-code-plugin&sort=stars&order=desc&per_page=50`
  - `https://api.github.com/search/code?q=filename:SKILL.md&per_page=50` (use to discover repos not caught by topics; resolve each hit to its parent repo for star count)
- Official Anthropic skills/plugin marketplace: WebSearch `"Anthropic Claude Code skills marketplace"` / `"Claude Code plugin marketplace"` to find the current listing page (URL may change over time), then WebFetch it.
- Aggregator/directory sites: WebSearch `"claude code skills directory"`, `"claude skills marketplace"`, `"awesome claude code skills"`. WebFetch any that expose a list with star/download-style counts.
- Buzz signal (annotation only, not part of ranking): WebSearch `"claude code skill" reddit OR "hacker news" OR twitter` over the last 7 days; if a skill from the ranked list is mentioned, tag it `buzzing` in the output — do not use this to rank or to include items otherwise absent from GitHub/marketplace data.

## 2. Rank

- Dedupe by canonical repo/listing URL.
- Keep only items matching the categories below (best-effort keyword match on repo name/description/topics):
  - **dev**: code, coding, mini app, bot, automation, cli, api, sdk, agent
  - **video**: video, ffmpeg, render, editing, youtube, transcript, subtitle, clip
  - Drop everything else.
- Sort by stars (GitHub) or the marketplace/aggregator's own download-count field, descending.
- Take the top 15-20.
- For each kept item, write one plain sentence describing what it does, derived from its README/description — not a copy-paste of marketing copy.

## 3. Diff against last week

- Call the Artifact "read" action on {{ARTIFACT_URL}}.
- Parse the JSON out of the `<script type="application/json" id="trend-data">` tag in the returned HTML. It is an array of up to 8 weekly snapshots, newest last; each snapshot is `{ "week": "YYYY-MM-DD", "items": [{ "url", "name", "stars", "rank" }, ...] }`.
- If the read fails (first-ever run) or the script tag is missing, treat history as empty — every item this week is `NEW`.
- For each item in this week's top list, compare against the most recent prior snapshot by URL:
  - Not present before → `NEW`
  - Rank improved (lower number) → `UP` with the rank delta
  - Rank worsened → `DOWN` with the rank delta
  - Unchanged → `=`
- Append this week's snapshot to the history array; if the array now has more than 8 entries, drop the oldest.

## 4. Publish

Rebuild the Artifact HTML:
- Title: "Claude Code Skills Trend Radar" (stable across redeploys).
- Favicon: 📡 (keep identical on every redeploy).
- A table: rank, name (linked to source), one-line description, category, stars, movement badge (↑N / ↓N / NEW / =).
- Footer: last-updated date (UTC) and, if any, `Skipped sources this week: <list>`.
- Embed the updated (≤8-entry) history array as `<script type="application/json" id="trend-data">...</script>`.
- Call the Artifact "publish" action with `url: {{ARTIFACT_URL}}` (after the very first run, when the URL is first minted, this placeholder won't exist yet — see Task 2) so it redeploys the same page instead of creating a new one.

## Output

Nothing further — the Artifact page is the deliverable. Do not send a chat
message unless explicitly asked to summarize.
```

- [ ] **Step 2: Read the file back and check spec coverage**

Walk the spec (`docs/superpowers/specs/2026-08-28-skills-trend-radar-design.md`) section by section — Purpose, Success Criteria, Architecture, Data Sources, Ranking, Error Handling, Testing, Schedule — and confirm each one is reflected in the prompt text above. There should be no gap.

- [ ] **Step 3: Commit**

```bash
git add prompts/weekly-trend-radar.md
git commit -m "Add weekly trend-radar agent prompt"
```

---

### Task 2: Manual first run — produce the initial Artifact

**Files:**
- Modify: none (this task's output is a published Artifact, not a repo file)
- Create: `README.md` (records the resulting URL)

**Interfaces:**
- Consumes: `prompts/weekly-trend-radar.md` from Task 1 (with `{{ARTIFACT_URL}}` left as a literal placeholder — on this first run there is no prior page to redeploy, so skip the "publish with existing url" nuance and just publish fresh).
- Produces: a live Artifact URL that Task 3 embeds into the finalized prompt.

- [ ] **Step 1: Execute the prompt's Collect → Rank → Diff → Publish steps by hand**

Follow `prompts/weekly-trend-radar.md` sections 1-3 exactly, with one difference: in section 3 ("Diff against last week") there is no existing Artifact yet, so treat history as empty and mark every item `NEW`. Build the HTML described in section 4 and publish it as a **new** Artifact (no `url` param — this mints the URL).

- [ ] **Step 2: Verify the published page**

Use the Artifact "read" action on the new URL and confirm:
- The table has 15-20 rows, all tagged `NEW`.
- Every row has a working link, a plausible one-line description, a category, and a star/download count.
- The `<script type="application/json" id="trend-data">` block round-trips (contains one snapshot with today's date and the same items).
- No `Skipped sources` line unless a source genuinely failed — if one did, confirm the rest of the run still completed.

Expected: all checks pass. If a check fails (e.g., malformed JSON, broken links, category filter let through something unrelated), fix the HTML/prompt and republish before moving on.

- [ ] **Step 3: Record the URL**

```markdown
# Claude Code Skills Trend Radar

Weekly-refreshed dashboard of the most popular Claude Code skills/plugins
(dev + video production focus).

- Live dashboard: <PASTE THE PUBLISHED ARTIFACT URL HERE>
- Design: [docs/superpowers/specs/2026-08-28-skills-trend-radar-design.md](docs/superpowers/specs/2026-08-28-skills-trend-radar-design.md)
- Weekly agent prompt: [prompts/weekly-trend-radar.md](prompts/weekly-trend-radar.md)
- Schedule: Tuesdays 09:00 UTC (12:00 Moscow) — schedule ID: <FILLED IN TASK 3>
```

Write this to `README.md` with the real URL substituted in.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Record live Artifact URL after first manual run"
```

---

### Task 3: Finalize the prompt and create the weekly schedule

**Files:**
- Modify: `prompts/weekly-trend-radar.md` (replace `{{ARTIFACT_URL}}` with the real URL from Task 2)
- Modify: `README.md` (fill in the schedule ID)

**Interfaces:**
- Consumes: the Artifact URL recorded in `README.md` (Task 2).
- Produces: an active weekly cloud schedule whose stored prompt is the finalized text from this task.

- [ ] **Step 1: Replace the placeholder**

In `prompts/weekly-trend-radar.md`, replace every `{{ARTIFACT_URL}}` with the literal URL from `README.md`. Also fix the one caveat noted in Task 2 Step 1 — the finalized prompt's section 3/4 now applies as originally written (there IS a prior page to read/redeploy from now on).

- [ ] **Step 2: Create the schedule**

Invoke the `schedule` skill to create a new cron routine:
- Cadence: weekly, Tuesday, 09:00 UTC.
- Prompt: the full finalized contents of `prompts/weekly-trend-radar.md`.

- [ ] **Step 3: Verify the schedule was created**

List scheduled routines (via the `schedule` skill's list action, or `CronList`) and confirm the new entry appears with the correct cron expression (Tuesday 09:00 UTC) and prompt text.

Expected: one active entry matching the routine just created.

- [ ] **Step 4: Record the schedule ID and commit**

Fill in the `<FILLED IN TASK 3>` placeholder in `README.md` with the real schedule ID.

```bash
git add prompts/weekly-trend-radar.md README.md
git commit -m "Finalize prompt with live URL and wire up weekly schedule"
```

---

## Done Criteria

- `prompts/weekly-trend-radar.md` contains the finalized, URL-filled instructions.
- The Artifact at the recorded URL shows a plausible, working first snapshot (verified in Task 2).
- A weekly cloud schedule exists targeting Tuesday 09:00 UTC with that exact prompt (verified in Task 3).
- `README.md` points at the live URL and schedule ID for future reference.
