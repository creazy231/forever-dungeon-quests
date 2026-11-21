#!/usr/bin/env node
// Names the subzone at a map point from recorded zone changes: the Polestar Client's upload log
// holds `zone` records (map, x, y, zone text, subzone text) wherever the player's zone or subzone
// text changed. Prints the recorded subzone texts within a radius of the point, nearest first.
//
//   node tools/subzone.mjs <uiMapID> <x> <y> [--r <percent>] [--file <sent.jsonl>]
//
// Default radius 3 (map percent); default file
// ~/Library/Application Support/gg.polestar.client/sent.jsonl. Record fields: Polestar's
// docs/RECORDING.md (P = map, x*100, y*100).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
const [mapArg, xArg, yArg] = argv.filter((a, i) => !a.startsWith("--") && !(argv[i - 1] ?? "").startsWith("--"));
const map = Number(mapArg), x = Number(xArg), y = Number(yArg);
if (!map || Number.isNaN(x) || Number.isNaN(y)) {
	console.error("usage: node tools/subzone.mjs <uiMapID> <x> <y> [--r <percent>] [--file <sent.jsonl>]");
	process.exit(2);
}
const r = Number(opt("--r", 3));
const file = opt("--file", path.join(os.homedir(), "Library/Application Support/gg.polestar.client/sent.jsonl"));

const seen = new Map(); // subzone text -> nearest distance
for (const line of fs.readFileSync(file, "utf8").split("\n")) {
	if (!line) continue;
	let chunk;
	try { chunk = JSON.parse(line); } catch { continue; }
	for (const rec of String(chunk.text ?? "").split("\n")) {
		const f = rec.split("\t");
		if (f[0] !== "zone" || Number(f[2]) !== map || !f[3]) continue;
		const d = Math.hypot(Number(f[3]) / 100 - x, Number(f[4]) / 100 - y);
		if (d > r) continue;
		const name = `${f[5] || "?"} / ${f[6] || "(no subzone)"}`;
		if (!seen.has(name) || seen.get(name) > d) seen.set(name, d);
	}
}
const list = [...seen].sort((a, b) => a[1] - b[1]);
if (!list.length) console.log(`no recorded zone change within ${r} of ${map} ${x},${y}`);
for (const [name, d] of list) console.log(`${d.toFixed(2)}  ${name}`);
