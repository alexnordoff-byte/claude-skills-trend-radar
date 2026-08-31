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

## Known blocker

The scheduled cloud run **cannot reach that API** — its sandbox egress
proxy returns `403 CONNECT tunnel failed` for `claudemarketplaces.com`.
The prompt deliberately halts without publishing in that case rather than
fall back to guesses, so the routine currently no-ops every Tuesday. Fix:
allow that host through the environment's egress policy
(`env_01BeP82Ak6pwS2nemdeCptif`). Until then the page is refreshed by hand.

## Operating it

- Check runs: `RemoteTrigger action:"list_runs" trigger_id:"trig_012LbsQmuACNR5KEs6wc53iU"`
- Read one run's log: `RemoteTrigger action:"get_run_log" session_id:"<id>"`
- Fire it manually: `RemoteTrigger action:"run" trigger_id:"trig_012LbsQmuACNR5KEs6wc53iU"`

The repo copy of the prompt is documentation; the copy stored on the
trigger is what actually runs. Change both together.
