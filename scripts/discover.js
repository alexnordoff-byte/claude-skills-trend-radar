#!/usr/bin/env node
// Candidate discovery for the dev lane. Read-only: prints what WOULD make the
// board so a human can decide. Writes nothing.
//
//   node scripts/discover.js
//
// Why this exists: the first star-based board was curated from "repos that were
// popular in the claudemarketplaces catalog", and that catalog froze on
// 2026-08-21. Anything that grew after that date could never become a
// candidate, so the board silently became "top of August" rather than "top
// now". This scans wide and compares against the board's current floor.

const fs = require("fs");

const token = process.env.GITHUB_TOKEN || "";
const headers = {
  accept: "application/vnd.github+json",
  "user-agent": "claude-skills-trend-radar-discover",
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};

const skills = JSON.parse(fs.readFileSync("data/skills.json", "utf8"));
const stars = JSON.parse(fs.readFileSync("data/stars.json", "utf8"));
const onBoard = new Set(skills.dev.map((s) => s.repo));
const floor = Math.min(...Object.values(stars.repos));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(params) {
  const res = await fetch(`https://api.github.com/search/repositories?${params}`, { headers });
  if (!res.ok) {
    console.warn(`  search HTTP ${res.status}`);
    return [];
  }
  return (await res.json()).items || [];
}

(async () => {
  const found = new Map(); // full_name -> { stars, why }

  // 1. Topic searches — catches repos that tag themselves, including new ones.
  for (const topic of ["claude-code-skill", "claude-skill", "claude-code-plugin"]) {
    for (const item of await search(`q=${encodeURIComponent("topic:" + topic)}&sort=stars&order=desc&per_page=100`)) {
      found.set(item.full_name, { stars: item.stargazers_count, why: `topic:${topic}` });
    }
    await sleep(7000); // unauthenticated search allows 10 requests/minute
  }

  // 2. The claudemarketplaces catalog as a second universe. Its install counts
  //    are frozen and must never be used for ranking, but the list of repos
  //    that host skills is still a useful net.
  try {
    const cat = await (await fetch("https://claudemarketplaces.com/api/skills")).json();
    const repos = [...new Set(cat.map((s) => s.repo))];
    for (let i = 0; i < repos.length; i += 25) {
      const q = repos.slice(i, i + 25).map((r) => `repo:${r}`).join(" ");
      for (const item of await search(`q=${encodeURIComponent(q)}&per_page=100`)) {
        if (item.stargazers_count > floor && !found.has(item.full_name)) {
          found.set(item.full_name, { stars: item.stargazers_count, why: "catalog" });
        }
      }
      await sleep(7000);
    }
  } catch (e) {
    console.warn(`catalog scan skipped: ${e.message}`);
  }

  const contenders = [...found.entries()]
    .filter(([name, v]) => v.stars > floor && !onBoard.has(name))
    .sort((a, b) => b[1].stars - a[1].stars);

  console.log(`board floor: ${floor.toLocaleString("ru-RU")} stars`);
  console.log(`scanned: ${found.size} repos — ${contenders.length} above the floor and not on the board\n`);
  contenders.forEach(([name, v]) => console.log(`  ${String(v.stars).padStart(7)}  ${name}  (${v.why})`));

  console.log(`
Judge each before adding to data/skills.json — star count alone is not enough:
  - Does the repo republish other people's skills under its own name? Skip it.
  - Do the stars belong to a product that merely ships a stub skill? Skip it.
  - Are the descriptions machine-generated boilerplate? Skip it.
  - Is the skill's main use writing/running/debugging software? If not, skip it.
Then cap at 2 skills per repo and keep the dev lane at roughly 15-18 rows.`);
})();
