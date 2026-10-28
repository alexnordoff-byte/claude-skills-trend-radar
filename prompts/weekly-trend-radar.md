# Curation procedure — Claude Code Skills Trend Radar

**The weekly refresh is no longer done by an agent.** GitHub Actions runs
`.github/workflows/weekly-radar.yml` every Tuesday at 09:00 UTC: it fetches
live star counts, rebuilds the page and commits. That job is deterministic
and needs no judgement.

What is left for a human (or an agent asked to help) is **curating
`data/skills.json`** — which skills belong on the board at all. That is a
judgement call and happens occasionally, not weekly.

## When to curate

- A tracked repo was renamed, archived or deleted — the weekly job will
  fail loudly on a missing repo. Fix the entry.
- Roughly monthly, look for newcomers:

  ```bash
  node scripts/discover.js
  ```

  It scans the skill topics plus the whole claudemarketplaces catalog,
  fetches live stars, and prints every repo above the board's current floor
  that is not already on it. Read-only — it decides nothing.

- A description has gone stale or reads like marketing copy.

**Why the script and not a memory.** The first star-based board was curated
from repos that were popular in the frozen August catalog, so anything that
grew later could never become a candidate — the board quietly became "top
of August". Running `discover.js` on 11 October surfaced seven repos above
the floor that were missing, one of which belonged at number five.

## Rules

- **At most 2 skills per repo.** Stars belong to the repo, so every skill
  in a monorepo carries the same number; without the cap one publisher's
  pack fills the board. Keep the `dev` lane at about 15 rows.
- **`bots`, `slides`, `creative`** are ranked by stars like `dev`, same
  rules (max 2 skills per repo, Russian descriptions, rejections recorded in
  `rejected`). `bots` = building Telegram/Discord bots and Mini Apps;
  `slides` = generating presentations; `creative` = writing, images and
  social content, not marketing/SEO. `scripts/discover.js` still scans only
  for `dev` — for the other lanes search GitHub by hand (e.g. "claude skill
  telegram bot") and check that the repo really holds a `SKILL.md`.
- **`dev`** means the skill's main use is writing, running or debugging
  software. Being "an agent" or "an automation" qualifies nothing — every
  Claude Code skill is that. Marketing, SEO, ads, social, note-taking and
  finance skills do not belong.
- **Descriptions in Russian**, one plain sentence saying what the skill
  does, derived from its real description rather than its marketing copy.
  Skill names, repo paths and commands stay in Latin.
- **Stars alone never earn a place.** Check each candidate and reject it if:
  it republishes other people's skills under its own name; its stars belong
  to a product that merely ships a stub skill; its descriptions are
  machine-generated boilerplate. Record every rejection and its reason in
  the `rejected` block of `data/skills.json`, so the next pass does not
  re-litigate the same repos.
- **Do not touch the `video` lane.** Its five rows are ranked by
  claudemarketplaces install counts, frozen since 2026-08-21 and labelled
  as frozen on the page. Revisit the whole lane only when a live source of
  per-skill usage data exists again.

## After editing

```bash
node scripts/fetch-stars.js   # refresh data/stars.json
node build.js                 # regenerate index.html, append a snapshot
```

Never hand-edit `index.html` — it is generated and your edits are lost.
Commit `index.html` and `data/` together.

## Why not an agent any more

The weekly job used to run as a Claude cloud routine. Attaching the
repository so the routine could push also scoped its GitHub access to that
one repository, and the proxy then refused every path to the star counts of
the tracked third-party repos:

```
api.github.com/search/repositories  → 403  "sessions are bound to their configured repositories"
api.github.com/repos/<owner>/<repo> → 403
github.com/<owner>/<repo> (HTML)    → 403
WebFetch github.com                 → ENOTFOUND
```

Inside GitHub Actions those reads are native and free. The routine is kept
disabled rather than deleted, in case the data source situation changes.
