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
- Keep only items matching the categories below (best-effort keyword match on repo name/description/topics):
  - **dev**: code, coding, mini app, bot, automation, cli, api, sdk, agent
  - **video**: video, ffmpeg, render, editing, youtube, transcript, subtitle, clip
  - Drop everything else.
- Sort by stars (GitHub) or the marketplace/aggregator's own download-count field, descending.
- Take the top 15-20.
- For each kept item, write one plain sentence describing what it does, derived from its README/description — not a copy-paste of marketing copy.

## 3. Diff against last week

- Call the Artifact "read" action on
  https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef.
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
- Call the Artifact "publish" action with
  `url: https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef`
  so it redeploys the same page instead of creating a new one.

## Output

Nothing further — the Artifact page is the deliverable. Do not send a chat
message unless explicitly asked to summarize.
