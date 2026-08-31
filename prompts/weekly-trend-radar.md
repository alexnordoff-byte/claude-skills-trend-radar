# Weekly Claude Code Skills Trend Radar — Agent Instructions

Run this end-to-end, unattended. Produce one outcome: the Artifact at
https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef is
redeployed with this week's data. No other output is needed.

## 1. Collect

Single source of truth: `https://claudemarketplaces.com/api/skills`

It returns a JSON array of ~23,000+ objects, one per individual skill (not
per repository). Fields used here:

- `id` — stable skill identifier, e.g. `vercel-labs/skills/find-skills`
- `name` — the skill's own name
- `repo` — owner/repo it lives in
- `description` — the skill's own description
- `installs` — integer, cumulative installs (this is the ranking metric)
- `stars` — integer, GitHub stars of the PARENT REPO (context only, never
  the ranking metric — a 20-skill monorepo reports the same star count on
  all 20 of its skills, so stars say nothing about an individual skill)
- `installCommand` — the exact command a user runs to install it

**This payload is ~18MB and has no pagination — query parameters like
`?limit=` are ignored and always return the full array.** You must fetch
and reduce it PROGRAMMATICALLY (shell + curl piped into a script, or any
available code-execution tool). Do NOT try to read it through a
summarizing fetch: the ranking depends on exact integers, and a summarized
or truncated read will silently invent numbers.

Reduce it in code to the ranked shortlist described in step 2, and print
only that shortlist — never load the full array into your own context.

**If you cannot fetch and parse this endpoint exactly** — network blocked,
no code execution available, malformed response — then STOP the run and
publish nothing. Do not fall back to estimating, to GitHub star counts, or
to a summarized read. A missed week is recoverable; a page full of
fabricated numbers is worse than no update.

## 2. Rank

- Rank by `installs`, descending. This is the only ranking metric.
- Keep only skills whose PRIMARY purpose is one of the two categories
  below. Being built as "an agent" or "an automation" does NOT by itself
  qualify anything — every Claude Code skill fits that description
  trivially, so it is not a useful filter on its own:
  - **dev**: the skill's main use case is writing, running, or debugging
    software — code generation, mini-app/CLI/API/SDK scaffolding, bot
    construction, developer tooling.
  - **video**: the skill's main use case is producing or editing video —
    rendering, cutting, subtitling, transcript-to-video, video pipelines.
  - If the skill's main use case is something else — marketing, ads, SEO,
    note-taking, social-media content, finance, image-only generation,
    general productivity — drop it, even if it is packaged as an "agent"
    or "automation" skill.
- Judge the category from `name` + `description`. Do not keep an item
  merely because a keyword appears somewhere in its text.
- **At most 2 skills per parent repo.** Keep that repo's two
  highest-install qualifying skills and drop the rest. Without this the
  board fills with a single publisher's pack — `microsoft/azure-skills`
  alone ships ~25 skills sitting within a few thousand installs of each
  other, and `mattpocock/skills` and `larksuite/cli` do the same.
- Take the top 15-20 that pass the category filter and the per-repo cap.
  If fewer than 15 qualify, publish what qualifies — never pad the list
  with items that failed the category test.
- **Inflation flag:** compute `installs / stars` for each kept item. If the
  ratio exceeds 10,000 (i.e. implausibly many installs for how few people
  starred the repo), mark that row `⚠` in the output and add a one-line
  footnote explaining the flag means the install count looks
  machine-inflated. Do not drop the item — show it flagged and let the
  reader judge. Items with `stars` of 0 get the flag automatically.
- For each kept item, write one plain sentence describing what it does,
  derived from its `description` — not a copy-paste of marketing copy.

## 3. Diff against last week

- Call the Artifact "read" action on
  https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef.
- If the read call itself fails (network error, timeout, non-2xx response)
  — as opposed to succeeding with no `trend-data` tag — retry once. If it
  still fails, STOP the run without publishing anything. A missed week is
  recoverable; an overwritten history is not, since this page is the only
  copy of the history.
- If the read succeeds but the `<script type="application/json"
  id="trend-data">` tag is missing (genuine first run, or the page was
  manually cleared), treat history as empty — every item this week is
  `NEW`.
- Otherwise parse the JSON out of that tag. It is an array of up to 8
  weekly snapshots, newest last. The current snapshot schema is:
  `{ "week": "YYYY-MM-DD", "items": [{ "id", "name", "repo", "installs", "rank" }, ...] }`
  Use the UTC calendar date of THIS run for this week's `"week"` field.
- **Legacy-schema reset (one time only):** if the stored snapshots use the
  old schema — items carrying `stars` and `url` but no `id` — they ranked
  repositories by stars, which is not comparable to ranking skills by
  installs. Discard that history entirely, start the array fresh with this
  week's snapshot alone, mark every item `NEW`, and note once in the
  footer that history was reset when the ranking metric changed. Do this
  only while old-schema snapshots are present; once the history holds
  `id`-keyed snapshots, never reset again.
- For each item in this week's top list, compare against the most recent
  prior snapshot **by `id`**:
  - Not present before → `NEW`
  - Rank improved (lower number) → `UP` with the rank delta
  - Rank worsened → `DOWN` with the rank delta
  - Unchanged rank → `=`
- Also compute each item's **install delta** versus that prior snapshot
  (`installs` now minus `installs` then). This is the week's actual growth
  signal — a skill can hold its rank while gaining 40,000 installs. Show
  it alongside the rank movement. Items that are `NEW` have no delta.
- Append this week's snapshot to the history array; if the array now has
  more than 8 entries, drop the oldest.

## 4. Publish

Compute each row's movement badge and install delta from the history
comparison you just did in step 3 — NEVER hardcode a movement value or
leave a stub function that always returns the same label. Render badges
and deltas as static text directly in each row's HTML, not via
client-side JavaScript that re-derives them from the embedded JSON at
page-load time — a page whose visible values depend on script logic
staying correct is exactly how this silently drifts wrong over time.

Rebuild the Artifact HTML:
- Put `<title>Claude Code Skills Trend Radar</title>` as the very first
  line of the file content (stable across redeploys — do not add any other
  `<head>`-level tags of your own).
- A table with these columns: rank, skill name (linked to its repo),
  parent repo, one-line description, category, installs, weekly install
  delta, stars (secondary context), movement badge, and the `⚠` inflation
  flag where it applies.
- Give each row a small click-to-copy control carrying that skill's
  `installCommand`, so a skill can be installed straight from the page.
- Footer: last-updated date (UTC); the inflation-flag footnote if any row
  is flagged; the history-reset note if this run performed the one-time
  legacy reset; and, if the run degraded in any way, what was skipped.
- Embed the updated (≤8-entry) history array as
  `<script type="application/json" id="trend-data">...</script>` — this is
  data storage for next week's diff, kept separate from the static values
  already rendered in the table.
- Call the Artifact "publish" action with:
  - `url: https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef`
    so it redeploys the same page instead of creating a new one.
  - `favicon: 📡` on every publish call (keep identical every week — this
    is a publish parameter, not page markup, do not try to encode it in
    the HTML itself).
  - If the publish call reports a version conflict, re-read the current
    page, merge this week's snapshot onto that newer content, and publish
    again. Never pass `force`.

## Output

Nothing further — the Artifact page is the deliverable. Do not send a chat
message unless explicitly asked to summarize.
