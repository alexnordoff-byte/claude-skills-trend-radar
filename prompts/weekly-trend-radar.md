# Weekly Claude Code Skills Trend Radar — Agent Instructions

Run this end-to-end, unattended. Produce one outcome: the Artifact at
https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef is
redeployed with this week's data. No other output is needed.

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
- Keep only items whose PRIMARY purpose is one of the two categories below. Being built as "an agent" or "an automation" does NOT by itself qualify anything — every Claude Code skill fits that description trivially, so it is not a useful filter on its own:
  - **dev**: the skill's main use case is writing, running, or debugging software — code generation, mini-app/CLI/API/SDK scaffolding, bot construction, developer tooling.
  - **video**: the skill's main use case is producing or editing video — rendering, cutting, subtitling, transcript-to-video, video pipelines.
  - If the item's main use case is something else — marketing, ads, SEO, note-taking, social-media content, finance, image-only generation, general productivity, etc. — drop it, even if it happens to be packaged as an "agent" or "automation" skill.
- Rank by GitHub star count only. Do not mix in a marketplace/aggregator's download count on the same sorted list — those are a different unit. If a source only exposes downloads (no GitHub star-equivalent), skip it for ranking purposes rather than interleaving it.
- Take the top 15-20 that pass the category filter. If fewer than 15 qualify, publish what qualifies — do not pad the list with items that failed the category test.
- For each kept item, write one plain sentence describing what it does, derived from its README/description — not a copy-paste of marketing copy.

## 3. Diff against last week

- Call the Artifact "read" action on
  https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef.
- If the read call itself fails (network error, timeout, non-2xx response) — as opposed to succeeding with no `trend-data` tag — retry once. If it still fails, STOP the run without publishing anything. A missed week is recoverable; an overwritten history is not, since this page is the only copy of the history.
- If the read succeeds but the `<script type="application/json" id="trend-data">` tag is missing (this is the genuine first-ever run, or the page was manually cleared), treat history as empty — every item this week is `NEW`.
- Otherwise, parse the JSON out of that tag. It is an array of up to 8 weekly snapshots, newest last; each snapshot is `{ "week": "YYYY-MM-DD", "items": [{ "url", "name", "stars", "rank" }, ...] }`. Use the UTC calendar date of THIS run for this week's `"week"` field.
- For each item in this week's top list, compare against the most recent prior snapshot by URL:
  - Not present before → `NEW`
  - Rank improved (lower number) → `UP` with the rank delta
  - Rank worsened → `DOWN` with the rank delta
  - Unchanged → `=`
- Append this week's snapshot to the history array; if the array now has more than 8 entries, drop the oldest.

## 4. Publish

Compute each row's movement badge from the history comparison you just did in step 3 — NEVER hardcode a movement value or leave a stub function that always returns the same label. Render each badge (↑N / ↓N / NEW / =) as static text directly in that row's HTML, not via client-side JavaScript that re-derives it from the embedded JSON at page-load time — a page whose visible badges depend on script logic staying correct is exactly how this silently drifts wrong over time.

Rebuild the Artifact HTML:
- Put `<title>Claude Code Skills Trend Radar</title>` as the very first line of the file content (stable across redeploys — do not add any other `<head>`-level tags of your own).
- A table: rank, name (linked to source), one-line description, category, stars, movement badge (the static value computed above).
- Footer: last-updated date (UTC) and, if any, `Skipped sources this week: <list>`.
- Embed the updated (≤8-entry) history array as `<script type="application/json" id="trend-data">...</script>` — this is data storage for next week's diff, kept separate from the static badges already rendered in the table.
- Call the Artifact "publish" action with:
  - `url: https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef` so it redeploys the same page instead of creating a new one.
  - `favicon: 📡` on every publish call (keep identical every week — this is a publish parameter, not page markup, do not try to encode it in the HTML itself).
  - If the publish call reports a version conflict, re-read the current page, merge this week's snapshot onto that newer content, and publish again. Never pass `force`.

## Output

Nothing further — the Artifact page is the deliverable. Do not send a chat
message unless explicitly asked to summarize.
