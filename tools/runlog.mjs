#!/usr/bin/env node
// Lists every recorded visit of one instance from the Polestar Client's upload log: per visit the
// time, character and level, then in time order the encounters, kills, loot, quest progress, accepts
// and turn-ins. A visit starts at an `enter` of that instance and ends at the next `enter` or the
// next record with an outdoor position. Record fields: Polestar's docs/RECORDING.md.
//
//   node tools/runlog.mjs <instance map id> [--file <sent.jsonl>] [--data <data/forever dir>]
//
// Default file: ~/Library/Application Support/gg.polestar.client/sent.jsonl. Names come from the
// reference data ($PS_CLONE/data/forever) when it is there.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const target = Number(argv.find((a) => /^\d+$/.test(a)));
if (!target) { console.error("usage: node tools/runlog.mjs <instance map id> [--file <sent.jsonl>] [--data <dir>]"); process.exit(2); }
const file = arg("--file") ?? path.join(os.homedir(), "Library/Application Support/gg.polestar.client/sent.jsonl");
const dataDir = arg("--data") ?? path.join(process.env.PS_CLONE ?? "", "data", "forever");
const tryLoad = (name) => { try { return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8")); } catch { return {}; } };
const npcs = tryLoad("npcs.json"), items = tryLoad("items.json"), objects = tryLoad("objects.json"), quests = tryLoad("quests.json");
const npcName = (id) => npcs[id]?.name ?? `npc ${id}`;
const itemName = (id) => items[id]?.name ?? `item ${id}`;

// The chunks in upload order, each record with its absolute time (chunk epoch + offset).
const chunks = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).sort((a, b) => a.seq - b.seq || a.at - b.at);
const visits = [];
let cur = null, who = "";
const hasOutdoorPos = (f, at) => f[at] && f[at + 1] && f[at + 2] && Number(f[at]) !== target;
for (const c of chunks) {
	let epoch = 0;
	for (const line of String(c.text ?? "").split("\n")) {
		const f = line.split("\t");
		const kind = f[0], t = Number(f[1]) || 0;
		// dt is tenths of a second since the chunk's server epoch (docs/RECORDING.md).
		const at = new Date((epoch + t / 10) * 1000).toISOString().slice(0, 19).replace("T", " ");
		if (kind === "chunk") { epoch = Number(f[3]) || Math.floor(c.at / 1000); continue; }
		if (kind === "session") { who = `${f[3]} ${f[4]} ${f[5]} level ${f[7]}`; if (cur) cur.who ??= who; continue; }
		if (kind === "level" && cur) { cur.events.push(`${at} level ${f[2]}`); continue; }
		if (kind === "enter") {
			if (cur) { visits.push(cur); cur = null; }
			if (Number(f[2]) === target) cur = { start: at, who, from: f[5] ? `${f[5]} ${(Number(f[6]) / 100).toFixed(2)},${(Number(f[7]) / 100).toFixed(2)}` : "inside already", events: [] };
			continue;
		}
		if (!cur) continue;
		if ((kind === "pos" && hasOutdoorPos(f, 2)) || (kind === "zone" && hasOutdoorPos(f, 2))) { visits.push(cur); cur = null; continue; }
		if (kind === "encounter") cur.events.push(`${at} encounter ${f[2]} ${f[3] === "1" ? "kill" : "wipe"}`);
		else if (kind === "kill") cur.events.push(`${at} kill ${f[2]} ${npcName(f[2])}${f[4] === "b" ? " (boss)" : f[4] === "e" ? " (elite)" : ""}${f[11] ? ` quest ${f[11]}` : ""}`);
		else if (kind === "loot") {
			const src = f[2] === "o" ? `object ${f[3]} ${objects[f[3]]?.name ?? ""}` : f[3] ? `${npcName(f[3])}` : "?";
			const got = (f[8] ?? "").split(";").filter(Boolean).map((x) => { const [id, n] = x.split(":"); return `${itemName(id)} (${id})${n > 1 ? ` x${n}` : ""}`; });
			if (got.length) cur.events.push(`${at} loot from ${src.trim()}: ${got.join(", ")}`);
		} else if (kind === "progress") cur.events.push(`${at} progress ${f[2]}.${f[3]} ${f[4]}/${f[5]} ${quests[f[2]]?.title ?? ""}`.trimEnd());
		else if (kind === "accept") cur.events.push(`${at} accept ${f[2]} ${quests[f[2]]?.title ?? ""}`.trimEnd());
		else if (kind === "turnin") cur.events.push(`${at} turnin ${f[2]} ${quests[f[2]]?.title ?? ""}`.trimEnd());
		else if (kind === "zone" && (f[5] || f[6])) cur.events.push(`${at} zone ${f[5] ?? ""} / ${f[6] ?? ""}`);
		else if (kind === "death") cur.events.push(`${at} death`);
		else if (kind === "cast" && f[2]) cur.events.push(`${at} cast ${f[2]}`);
	}
}
if (cur) visits.push(cur);

console.log(`# Recorded visits of instance ${target}: ${visits.length}`);
for (const v of visits) {
	// The recorder writes some records late with their own time (a kill after its loot): sort by time, ties in write order.
	v.events = v.events.map((e, i) => [e, i]).sort((x, y) => (x[0].slice(0, 19) < y[0].slice(0, 19) ? -1 : x[0].slice(0, 19) > y[0].slice(0, 19) ? 1 : x[1] - y[1])).map((x) => x[0]);
	console.log(`\n## ${v.start} ${v.who ?? ""} (entered from ${v.from})`);
	for (const e of v.events) console.log(`- ${e}`);
}
