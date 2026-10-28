#!/usr/bin/env node
// Writes data/stars.json with live GitHub star counts for every repo in the
// star-ranked lanes (dev, bots, slides, creative) of data/skills.json. Run inside GitHub Actions, where GITHUB_TOKEN
// gives 5000 requests/hour; works unauthenticated too, just rate-limited.
//
// Exits non-zero if any repo could not be read, so the workflow fails loudly
// instead of letting a stale stars.json reach the page.

const fs = require("fs");

const token = process.env.GITHUB_TOKEN || "";
const headers = {
  accept: "application/vnd.github+json",
  "user-agent": "claude-skills-trend-radar",
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};

const skillsData = JSON.parse(fs.readFileSync("data/skills.json", "utf8"));
const STAR_LANES = ["dev", "bots", "slides", "creative"];
const repos = [...new Set(STAR_LANES.flatMap((l) => skillsData[l].map((s) => s.repo)))];
const stars = {};

async function viaSearch() {
  const q = repos.map((r) => `repo:${r}`).join(" ");
  const url = `https://api.github.com/search/repositories?per_page=100&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`search failed: HTTP ${res.status} — falling back to per-repo lookups`);
    return;
  }
  for (const item of (await res.json()).items || []) stars[item.full_name] = item.stargazers_count;
}

async function viaRepo(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) {
    console.warn(`  ${repo}: HTTP ${res.status}`);
    return;
  }
  stars[repo] = (await res.json()).stargazers_count;
}

(async () => {
  await viaSearch();

  // GitHub's search index intermittently omits repos; fill the gaps singly.
  const missing = repos.filter((r) => stars[r] === undefined);
  if (missing.length) {
    console.log(`search missed ${missing.length} repo(s), fetching individually`);
    for (const r of missing) await viaRepo(r);
  }

  const stillMissing = repos.filter((r) => stars[r] === undefined);
  if (stillMissing.length) {
    console.error(`\nERROR: no star count for ${stillMissing.length} repo(s): ${stillMissing.join(", ")}`);
    console.error("Refusing to write a partial stars.json — the page would silently drop those rows.");
    process.exit(1);
  }

  const out = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    source: token ? "github api (authenticated)" : "github api (anonymous)",
    repos: Object.fromEntries(repos.map((r) => [r, stars[r]])),
  };
  fs.writeFileSync("data/stars.json", JSON.stringify(out, null, 1) + "\n");
  console.log(`wrote data/stars.json — ${repos.length} repos, ${out.fetchedAt}`);
  repos.forEach((r) => console.log(`  ${String(stars[r]).padStart(7)}  ${r}`));
})();
