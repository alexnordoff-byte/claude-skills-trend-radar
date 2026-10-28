#!/usr/bin/env node
// Builds index.html from data/skills.json + data/stars.json + data/history.json.
// Deterministic: no network, no judgement. The weekly agent refreshes the data
// files, runs this, and commits. Run: node build.js

const fs = require("fs");

const skills = JSON.parse(fs.readFileSync("data/skills.json", "utf8"));
const stars = JSON.parse(fs.readFileSync("data/stars.json", "utf8"));
const history = JSON.parse(fs.readFileSync("data/history.json", "utf8"));

const today = new Date().toISOString().slice(0, 10);
// Only snapshots in the current schema (items carry `unit`) are comparable.
// Pre-October snapshots ranked by claudemarketplaces installs and cannot be
// diffed against star counts — ignore them rather than print a nonsense delta.
const prev = history.filter((s) => s.week !== today && s.items.every((i) => i.unit)).pop() || null;
const prevById = prev ? Object.fromEntries(prev.items.map((i) => [i.id, i])) : {};

const RU_MONTH = ["января","февраля","марта","апреля","мая","июня",
                  "июля","августа","сентября","октября","ноября","декабря"];
function ruDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return `${d.getUTCDate()} ${RU_MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const nbsp = (n) => n.toLocaleString("ru-RU").replace(/ /g, "&nbsp;").replace(/ /g, "&nbsp;");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- assemble rows -------------------------------------------------------
const rows = [];
// Table order: dev, video, then the newer lanes. Video stays right after dev so its
// row numbers (and therefore its week-over-week movement) are unchanged.
const LANES = {
  dev: "разработка",
  video: "видео",
  bots: "боты",
  slides: "презентации",
  creative: "креатив",
};
function starLane(lane) {
  const part = [];
  for (const s of skills[lane]) {
    const value = stars.repos[s.repo];
    if (value === undefined) continue; // no live number this week — skip, never guess
    part.push({ id: `${s.repo}/${s.name}`, ...s, lane, value, unit: "stars" });
  }
  rows.push(...part.sort((a, b) => b.value - a.value));
}
starLane("dev");
for (const s of skills.video) {
  rows.push({ id: `${s.repo}/${s.name}`, ...s, lane: "video", value: s.installs, unit: "installs" });
}
for (const lane of ["bots", "slides", "creative"]) starLane(lane);

// ---- movement vs previous snapshot --------------------------------------
let rank = 0;
for (const r of rows) {
  r.rank = ++rank;
  const was = prevById[r.id];
  if (!was) { r.move = { label: "НОВОЕ", cls: "" }; continue; }
  const d = r.value - was.value;
  r.delta = d;
  if (was.rank === r.rank) r.move = { label: "=", cls: "same" };
  else if (was.rank > r.rank) r.move = { label: `↑${was.rank - r.rank}`, cls: "up" };
  else r.move = { label: `↓${r.rank - was.rank}`, cls: "down" };
}

// ---- freshness ----------------------------------------------------------
const staleDays = Math.floor((Date.parse(today) - Date.parse(skills.videoFrozenSince || "2026-08-21")) / 864e5);
const warnings = [];
if (stars.fetchedAt !== today) {
  warnings.push(`Живые данные по звёздам не обновлялись с ${ruDate(stars.fetchedAt)} — показаны прошлые числа.`);
}
warnings.push(
  `Колонка «видео» ранжируется по установкам из claudemarketplaces.com, а тот ресурс не обновляет данные с ${ruDate("2026-08-21")} ` +
  `(${staleDays} дн.). Эти пять строк заморожены и движение по ним не считается, пока не появится живой источник.`
);

const count = (lane) => String(rows.filter((r) => r.lane === lane).length);

// ---- render -------------------------------------------------------------
const row = (r) => `          <tr>
            <td class="rank${r.rank <= 3 ? " top" : ""}">${String(r.rank).padStart(2, "0")}</td>
            <td class="skill"><a href="https://github.com/${r.repo}">${esc(r.name)}</a><span class="repo">${esc(r.repo)}</span></td>
            <td class="desc">${esc(r.desc)}</td>
            <td><span class="chip ${r.lane}">${LANES[r.lane]}</span></td>
            <td class="num val">${nbsp(r.value)}<span class="unit">${r.unit === "stars" ? "звёзд" : "установок"}</span>${
              r.delta ? `<span class="delta${r.delta > 0 ? " pos" : ""}">${r.delta > 0 ? "+" : ""}${nbsp(r.delta)} за неделю</span>` : ""
            }</td>
            <td><span class="badge ${r.move.cls}">${r.move.label}</span></td>
            <td><button class="copy" data-cmd="npx skills add https://github.com/${r.repo} --skill ${r.name}">копировать</button></td>
          </tr>`;

const html = fs.readFileSync("template.html", "utf8")
  .replace("{{DATE}}", ruDate(today))
  .replace("{{ROWS}}", rows.map(row).join("\n\n"))
  .replace("{{TOTAL}}", String(rows.length))
  .replace("{{DEV}}", count("dev"))
  .replace("{{VIDEO}}", count("video"))
  .replace("{{BOTS}}", count("bots"))
  .replace("{{SLIDES}}", count("slides"))
  .replace("{{CREATIVE}}", count("creative"))
  .replace("{{WARNINGS}}", warnings.map((w) => `    <p class="warn">${w}</p>`).join("\n"));

fs.writeFileSync("index.html", html);

// ---- append snapshot ----------------------------------------------------
const snapshot = { week: today, items: rows.map((r) => ({ id: r.id, name: r.name, repo: r.repo, lane: r.lane, value: r.value, unit: r.unit, rank: r.rank })) };
const kept = history.filter((s) => s.week !== today);
kept.push(snapshot);
while (kept.length > 8) kept.shift();
fs.writeFileSync("data/history.json", JSON.stringify(kept, null, 1) + "\n");

console.log(`built index.html — ${rows.length} rows (${Object.keys(LANES).map((l) => `${count(l)} ${l}`).join(", ")}), week ${today}`);
console.log(`history: ${kept.map((s) => s.week).join(", ")}`);
warnings.forEach((w) => console.log("warning: " + w));
