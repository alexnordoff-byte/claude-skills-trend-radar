# Weekly Claude Code Skills Trend Radar — Agent Instructions

Run end-to-end, unattended. One outcome: a commit pushed to `master` of
`alexnordoff-byte/claude-skills-trend-radar`. GitHub Pages serves
`index.html` from `master`; the push is the publish.

`build.js` renders the page. You refresh the data it reads and run it —
do NOT hand-edit `index.html`, it is generated and your edits are lost.

## 1. Refresh live star counts

The repos to track are the `repo` values in `data/skills.json` (`dev` lane).
Fetch all of them in ONE GitHub Search request — `repo:` qualifiers OR
together, so a single call covers every repo:

```bash
curl -sS "https://api.github.com/search/repositories?per_page=100&q=repo:obra/superpowers+repo:mattpocock/skills+..."
```

Build the query from `data/skills.json` rather than typing it out. Write the
result to `data/stars.json`:

```json
{ "fetchedAt": "YYYY-MM-DD", "source": "github search api, repo: qualifiers",
  "repos": { "owner/name": 12345, "...": 0 } }
```

Notes:
- Use today's UTC date for `fetchedAt`. `build.js` warns on the page if this
  date is not today, so never copy an old value forward.
- GitHub's search index occasionally omits a repo. For any repo the search
  misses, fetch it singly (`https://api.github.com/repos/<owner>/<name>`,
  field `stargazers_count`). Unauthenticated REST allows 60 requests/hour —
  fine for a handful.
- **If GitHub is unreachable or returns no usable numbers, STOP. Commit
  nothing.** Do not reuse last week's `stars.json` as if it were fresh and
  do not estimate. A missed week is recoverable; a page that silently shows
  stale numbers as current is the exact failure this radar had for five
  weeks in September.

## 2. Keep the skill list current (light touch)

`data/skills.json` is curated, not auto-generated. Most weeks it needs no
change. Review it only when something obvious has shifted:

- A tracked repo has been renamed, archived, or deleted — remove or update
  its rows.
- A skills repo has clearly broken out (search
  `topic:claude-code-skill`, `topic:claude-skill`, `topic:claude-code-plugin`
  sorted by stars) and now out-ranks something on the board — add its best
  one or two skills, drop the weakest rows to stay at ~15 in the `dev` lane.

Rules when editing it:
- **At most 2 skills per repo.** Stars belong to the repo, so every skill in
  a monorepo carries the same number; without the cap one publisher's pack
  fills the board.
- `dev` means the skill's main use is writing, running or debugging
  software. Being "an agent" or "an automation" qualifies nothing — every
  Claude Code skill is that. Marketing, SEO, ads, social, note-taking and
  finance skills do not belong here.
- Descriptions are **in Russian**, one plain sentence saying what the skill
  does. Not a translation of marketing copy. Skill names, repo paths and
  commands stay in Latin.

Do not touch the `video` lane. Its five rows are ranked by
claudemarketplaces install counts, which froze on 2026-08-21; `build.js`
labels them as frozen on the page. Change them only when a live source of
per-skill usage data exists again — then revisit this whole section.

## 3. Build

```bash
node build.js
```

It reads `data/skills.json`, `data/stars.json` and `data/history.json`,
writes `index.html`, appends this week's snapshot to the history (keeping
the last 8), and prints any freshness warnings it put on the page. Read its
output. If it reports something unexpected, fix the data and run it again
rather than editing the page by hand.

## 4. Commit and push

**Publish to `master` and nothing else** — Pages serves from there, so a
commit on another branch changes nothing a reader sees. This routine may
drop you on a generated branch such as `claude/<something>`:

```bash
git rev-parse --abbrev-ref HEAD          # if this is not "master":
git stash && git checkout master && git stash pop
```

Then:

```bash
git add index.html data/
git commit -m "Weekly trend radar: <YYYY-MM-DD>"
git push origin master
```

If the push is rejected because the remote moved ahead, `git pull --rebase`
and push again. Never force-push: this history is the only copy of every
prior weekly snapshot.

## Output

Nothing further — the pushed commit is the deliverable. Do not send a chat
message unless explicitly asked to summarize.
