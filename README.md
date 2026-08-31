# Claude Code Skills Trend Radar

Weekly-refreshed dashboard of the most popular Claude Code skills/plugins
(dev + video production focus).

- Live dashboard: https://claude.ai/code/artifact/7d96599d-0031-4fad-a517-c6523aaffbef
- Design: [docs/superpowers/specs/2026-08-28-skills-trend-radar-design.md](docs/superpowers/specs/2026-08-28-skills-trend-radar-design.md)
- Weekly agent prompt: [prompts/weekly-trend-radar.md](prompts/weekly-trend-radar.md)
- Schedule: Tuesdays 09:00 UTC (12:00 Moscow) — schedule ID: trig_012LbsQmuACNR5KEs6wc53iU

## Data source

Ranking comes from `https://claudemarketplaces.com/api/skills` — one JSON
array, ~23,700 skills, with a real `installs` count per individual skill.
Installs, not GitHub stars, are the ranking metric: a monorepo's star count
is reported identically on every skill inside it, so it says nothing about
any one of them (`zarazhangrui/frontend-slides`: 27,032 stars, 852
installs).

## Network access

The routine runs in a dedicated cloud environment
(`env_01LyDxe5oZ1feDz6rvreAjK1`) with **Network access: Custom** and
exactly two allowed domains:

```
claudemarketplaces.com
*.frame.claudeusercontent.com
```

The first is the data source; the second is how the Artifact is read and
republished. **Custom replaces the Trusted allowlist rather than extending
it** — dropping either domain breaks the run. Verified working end to end
on 2026-08-31 (session `cse_01YEnDnbjrUtqW3mZ6VuyyFc`, 562s, published).

If a run ever halts, its log names the blocked host explicitly.

## Operating it

- Check runs: `RemoteTrigger action:"list_runs" trigger_id:"trig_012LbsQmuACNR5KEs6wc53iU"`
- Read one run's log: `RemoteTrigger action:"get_run_log" session_id:"<id>"`
- Fire it manually: `RemoteTrigger action:"run" trigger_id:"trig_012LbsQmuACNR5KEs6wc53iU"`

The repo copy of the prompt is documentation; the copy stored on the
trigger is what actually runs. Change both together.
