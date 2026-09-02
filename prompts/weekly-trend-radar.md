# Weekly Claude Code Skills Trend Radar — Agent Instructions

Run this end-to-end, unattended. Produce one outcome: a commit pushed to
this repository that updates `index.html` and `data/history.json` with this
week's data. GitHub Pages serves `index.html`; the push is the publish.

The page is written **in Russian** — see step 4. These instructions stay in
English; the output does not.

## 1. Collect

Single source of truth: `https://claudemarketplaces.com/api/skills`

It returns a JSON array of ~23,000+ objects, one per individual skill (not
per repository). Fields used here:

- `id` — stable skill identifier, e.g. `vercel-labs/skills/find-skills`
- `name` — the skill's own name
- `repo` — owner/repo it lives in
- `description` — the skill's own description (English)
- `installs` — integer, cumulative installs (this is the ranking metric)
- `stars` — integer, GitHub stars of the PARENT REPO (context only, never
  the ranking metric — a 20-skill monorepo reports the same star count on
  all 20 of its skills, so stars say nothing about an individual skill)
- `installCommand` — the exact command a user runs to install it

**This payload is ~18MB and has no pagination — query parameters like
`?limit=` are ignored and always return the full array.** Fetch and reduce
it PROGRAMMATICALLY (`curl` into a file, then a Python or Node script). Do
NOT try to read it through a summarizing fetch: the ranking depends on
exact integers, and a summarized or truncated read will silently invent
numbers. Print only the reduced shortlist — never load the full array into
your own context.

**If you cannot fetch and parse this endpoint exactly** — network blocked,
malformed response — then STOP the run, commit nothing, and say why. Do not
fall back to estimating or to GitHub star counts. A missed week is
recoverable; a page full of fabricated numbers is worse than no update.

## 2. Rank

- Rank by `installs`, descending. This is the only ranking metric.
- Keep only skills whose PRIMARY purpose is one of the two categories
  below. Being built as "an agent" or "an automation" does NOT by itself
  qualify anything — every Claude Code skill fits that description
  trivially, so it is not a useful filter on its own:
  - **dev** (`разработка`): the skill's main use case is writing, running,
    or debugging software — code generation, mini-app/CLI/API/SDK
    scaffolding, bot construction, developer tooling.
  - **video** (`видео`): the skill's main use case is producing or editing
    video — rendering, cutting, subtitling, transcript-to-video, video
    pipelines.
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
  ratio exceeds 10,000 (implausibly many installs for how few people
  starred the repo), mark that row `⚠`. Items with `stars` of 0 get the
  flag automatically. Do not drop flagged items — show them flagged and
  let the reader judge.

## 3. Diff against last week

- Read `data/history.json` from the repository working copy. It is an array
  of up to 8 weekly snapshots, newest last:
  `{ "week": "YYYY-MM-DD", "items": [{ "id", "name", "repo", "installs", "rank" }, ...] }`
- If the file is missing or unparseable, STOP and commit nothing rather
  than overwriting it — git has every previous version, and a corrupted
  history is a real loss. Say what you found.
- Use the UTC calendar date of THIS run as this week's `"week"` value. If
  the newest stored snapshot already carries that same date (a re-run on
  the same day), REPLACE it rather than appending a duplicate.
- For each item in this week's top list, compare against the most recent
  prior snapshot **by `id`**:
  - Not present before → `НОВОЕ`
  - Rank improved (lower number) → `↑N` with the rank delta
  - Rank worsened → `↓N` with the rank delta
  - Unchanged rank → `=`
- Also compute each item's **install delta** versus that prior snapshot
  (`installs` now minus `installs` then). A skill can hold its rank while
  gaining 40,000 installs — that is the week's real growth signal. Items
  that are `НОВОЕ` have no delta.
- Append this week's snapshot; if the array then exceeds 8 entries, drop
  the oldest.

## 4. Rebuild `index.html` (in Russian)

Keep the existing page's structure, design tokens, fonts, and CSS — edit
the data, not the design. Preserve: the light/dark token blocks, the
`<title>Тренд-радар скиллов Claude Code</title>`, the emoji favicon, the
stat rail, the table, the notes block, and the copy-to-clipboard script.

- **All prose is in Russian**: headings, the standfirst, column headers,
  category chips (`разработка` / `видео`), badges (`НОВОЕ`), the notes.
  Skill names, repo paths, and install commands stay verbatim in Latin.
- Write each skill's one-sentence description **in Russian**, derived from
  its English `description` — a plain explanation of what it does, not a
  translation of marketing copy.
- Update the eyebrow date and the stat rail counts (total, разработка,
  видео, skills scanned, flagged).
- Render movement badges and install deltas as **static text in each row**,
  computed in step 3 — never hardcode a value, never leave a stub function,
  and never re-derive them in client-side JavaScript at page load. A page
  whose visible values depend on script logic staying correct is exactly
  how this silently drifts wrong.
- Update the notes block: the source line with the current date and skill
  count, the per-repo cap note, the `⚠` explanation if any row is flagged,
  and — only while it is still true — the note that everything reads
  `НОВОЕ` because there is no comparable prior week. Delete that last note
  once real movement exists.

## 5. Commit and push

**Publish to `master` and nothing else.** GitHub Pages serves this site
from `master`, so a commit on any other branch changes nothing a reader can
see. The routine may drop you on a generated branch such as
`claude/<something>` — check first and move if so:

```bash
git rev-parse --abbrev-ref HEAD          # if this is not "master":
git stash && git checkout master && git stash pop
```

Then:

```bash
git add index.html data/history.json
git commit -m "Weekly trend radar: <YYYY-MM-DD>"
git push origin master
```

The push is the publish — GitHub Pages redeploys within about a minute.
Do not open a pull request; commit straight to `master`.

If the push is rejected because the remote moved ahead, `git pull --rebase`
and push again. Never force-push: the history in this repo is the only copy
of every prior weekly snapshot.

## Output

Nothing further — the pushed commit is the deliverable. Do not send a chat
message unless explicitly asked to summarize.
