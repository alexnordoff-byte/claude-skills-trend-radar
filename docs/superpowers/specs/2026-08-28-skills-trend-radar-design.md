# Claude Code Skills Trend Radar — Design

## Purpose

Personal weekly digest of the most popular/trending skills, plugins, and
agents for Claude Code, published as a self-updating Artifact dashboard.
Focus categories: development (coding, mini-apps, bots) and video
production. Owner-only for now; may be opened up later.

## Success Criteria

- Every Tuesday 09:00 UTC (12:00 Moscow), a cloud scheduled agent runs
  unattended and refreshes a single Artifact URL with the current top
  skills.
- Dashboard shows top ~15-20 items ranked by absolute popularity
  (stars/downloads), with a short "what it's for" description and
  week-over-week movement (↑/↓/NEW).
- A source being down for one run does not break the whole report — it's
  noted and skipped, not fatal.
- First run is manual/verified before the schedule is turned on.

## Architecture

One cloud scheduled agent (`/schedule`), triggered weekly. Each run is a
self-contained session with no persistent server or database:

1. **Collect** — query sources for skill/plugin listings.
2. **Rank** — dedupe, sort by stars/downloads, filter to dev + video
   production categories (best-effort).
3. **Diff** — read the currently-published Artifact's embedded JSON
   (last week's snapshot) and compute movement per item.
4. **Publish** — re-render and redeploy the same Artifact URL, embedding
   this week's snapshot as JSON for next week's diff.

No separate database — history lives inside the Artifact page itself
(current snapshot + a short rolling window, e.g. last 8 weeks, for
sparkline/trend purposes). This avoids standing up or maintaining any
server.

## Data Sources

- **GitHub** (primary) — Search API for repos/topics such as
  `claude-code-skill`, `claude-skill`, `claude-code-plugin`, and
  repos containing `SKILL.md`. No auth required for public search
  (rate-limited, acceptable for a weekly run).
- **Official Anthropic skills/plugin marketplace** — fetched/parsed each
  run; page structure may change over time (known brittleness, fix
  opportunistically).
- **Aggregator sites** (e.g. skills.mp-style directories) — fetched via
  WebFetch/WebSearch where they expose counts.
- **Social buzz** (Reddit/HN/X) — supplementary "buzzing" annotation
  only, not part of the ranking metric (no reliable download counts
  there).

## Ranking

- Metric: absolute current popularity (stars / downloads), not
  week-over-week delta.
- Dedup by canonical repo/listing URL across sources.
- Category filter: best-effort keyword/topic match against dev
  (code/mini-apps/bots) and video production; items outside these are
  dropped from the top list.
- Top ~15-20 items shown.

## Error Handling

If a source is unreachable or its page structure breaks parsing: skip
that source for the run, continue with the rest, and note "source X
unavailable this week" in the dashboard footer. Never abort the whole
report over one bad source.

## Testing / Verification

- First execution is run manually (not on the schedule) and the
  resulting Artifact is checked by eye for plausibility before the
  weekly cron is enabled.
- Each subsequent run is self-verifying in the sense that a broken
  source degrades gracefully (see Error Handling) rather than producing
  no report.

## Schedule

Weekly, Tuesday 09:00 UTC (12:00 Moscow time).

## Out of Scope (v1)

- Public sharing / multi-user access (owner-only for now).
- Telegram push notifications (may be added later as a thin extra step).
- Long-term historical database beyond a short rolling window embedded
  in the page.
- Perfect category classification (best-effort only).
