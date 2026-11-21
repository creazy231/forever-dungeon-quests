#!/usr/bin/env node
// A dungeon's quests as a worksheet to write its guides from: every quest of its Codex page for one
// side, with lead-ins in order, givers and enders, each objective numbered as lint counts it and where
// it is done (which boss, trash inside, or outside and in which zones), rewards, and flags; then the
// bosses in journal order with the quests tied to them, and quests the data ties to the dungeon that
// the page leaves out.
//
//   node tools/worksheet.mjs <dungeon key> [--faction A|H] [--codex <Polestar_Codex dir>] [--data <data/forever dir>]
//
// Defaults: $ADDONS/Polestar_Codex (the installed Polestar's page and quest ids) and
// $PS_CLONE/data/forever (the toolchain's reference data, the one lint and playtest use).
// Both factions without --faction. Facts only: nothing here is guide text.
//
// Flags:
//   CITY-OTHER-SIDE      a city dungeon of the other faction: no guide for this side
//   NOT-IN-SHIPPED-DATA  the installed Polestar's data lacks the quest: write it self-contained
//   OTHER-INSTANCE <x>   the quest or a lead-in needs another dungeon or raid: left out
//   RETURN-TRIP <lead>   a lead-in needs this dungeon and is handed in outside: a second run
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CITY = { "ragefire-chasm": "H", "ruins-of-lordaeron": "H", "the-hall-of-thanes": "A", "stormwind-stockade": "A" };
const CLASS_BITS = { Warrior: 1, Paladin: 2, Hunter: 4, Rogue: 8, Priest: 16, Shaman: 64, Mage: 128, Warlock: 256, Druid: 1024 };
const SIDE = { A: "Alliance", H: "Horde" };

function parseArgs(argv) {
	const opts = { faction: null, codex: null, data: null, key: null };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--faction") opts.faction = argv[++i];
		else if (a === "--codex") opts.codex = argv[++i];
		else if (a === "--data") opts.data = argv[++i];
		else if (!opts.key) opts.key = a;
	}
	if (!opts.key || (opts.faction && !SIDE[opts.faction])) {
		console.error("usage: node tools/worksheet.mjs <dungeon key> [--faction A|H] [--codex <dir>] [--data <dir>]");
		process.exit(2);
	}
	opts.codex ??= path.join(process.env.ADDONS ?? "", "Polestar_Codex");
	opts.data ??= path.join(process.env.PS_CLONE ?? "", "data", "forever");
	return opts;
}

const opts = parseArgs(process.argv.slice(2));
const codex = JSON.parse(execFileSync("luajit", [path.join(here, "codex-page.lua"), opts.codex, opts.key], { encoding: "utf8", maxBuffer: 64 << 20 }));
const load = (name) => JSON.parse(fs.readFileSync(path.join(opts.data, name), "utf8"));
const quests = load("quests.json");
const npcs = load("npcs.json");
const items = load("items.json");
const objects = load("objects.json");
const zones = load("zones.json");
const races = load("races.json");

const { summary, page } = codex;
const map = summary.map;
const shipped = new Set(codex.installedQuestIds);
const instanceName = (id) => codex.instances[String(id)]?.name ?? `instance ${id}`;
const zoneName = (id) => zones[id]?.name ?? `map ${id}`;
const bossByNpc = new Map((page.bosses ?? []).filter((b) => b.npc).map((b) => [b.npc, b]));
const bossByObject = new Map((page.bosses ?? []).filter((b) => b.object).map((b) => [b.object, b]));

// Where a creature or object is: this instance, other instances, outdoor zones.
function placeOf(rec) {
	const inst = rec?.instances ?? [];
	return {
		inside: inst.includes(map),
		others: inst.filter((m) => m !== map),
		zones: Object.keys(rec?.spawns ?? {}).map(Number),
	};
}
const onlyElsewhere = (p) => !p.inside && p.zones.length === 0 && p.others.length > 0;
const onlyInside = (p) => p.inside && p.zones.length === 0;

function npcText(id) {
	const n = npcs[id];
	const b = bossByNpc.get(id);
	if (b) return `boss ${b.name}`;
	const p = placeOf(n);
	const name = n?.name ?? `npc ${id}`;
	if (p.inside) return `${name} (npc ${id}) inside`;
	if (p.zones.length) return `${name} (npc ${id}) in ${p.zones.map(zoneName).join(", ")}`;
	if (p.others.length) return `${name} (npc ${id}) in ${p.others.map(instanceName).join(", ")}`;
	return `${name} (npc ${id}), no place in the data`;
}

function objectText(id) {
	const o = objects[id];
	const b = bossByObject.get(id);
	if (b) return `boss ${b.name} (object ${id})`;
	const p = placeOf(o);
	const name = o?.name ?? `object ${id}`;
	if (p.inside) return `${name} (object ${id} inside)`;
	if (p.zones.length) return `${name} (object ${id}) in ${p.zones.map(zoneName).join(", ")}`;
	if (p.others.length) return `${name} (object ${id}) in ${p.others.map(instanceName).join(", ")}`;
	return `${name} (object ${id}), no place in the data`;
}

// An item's sources, grouped: bosses here, inside here, outside, other instances, vendors.
function itemSources(id) {
	const it = items[id];
	const out = { text: [], inside: false, outside: false, elsewhere: new Set() };
	if (!it) return { ...out, text: ["not in the data"] };
	const npcIds = Object.keys(it.drops?.npc ?? {}).map(Number);
	const objIds = Object.keys(it.drops?.object ?? {}).map(Number);
	const inside = [], outside = new Map(), other = new Set(), bosses = [];
	for (const nid of npcIds) {
		const b = bossByNpc.get(nid);
		const p = placeOf(npcs[nid]);
		if (b) { bosses.push(`boss ${b.name}`); out.inside = true; continue; }
		if (p.inside) { inside.push(npcs[nid]?.name ?? `npc ${nid}`); out.inside = true; }
		for (const z of p.zones) { out.outside = true; if (!outside.has(z)) outside.set(z, []); outside.get(z).push(npcs[nid]?.name ?? `npc ${nid}`); }
		for (const m of p.others) { other.add(instanceName(m)); }
		if (onlyElsewhere(p)) p.others.forEach((m) => out.elsewhere.add(instanceName(m)));
	}
	for (const oid of objIds) {
		const b = bossByObject.get(oid);
		const p = placeOf(objects[oid]);
		if (b) { bosses.push(`boss ${b.name} (object ${oid})`); out.inside = true; continue; }
		if (p.inside) { inside.push(`object ${oid} ${objects[oid]?.name ?? ""}`.trim()); out.inside = true; }
		for (const z of p.zones) { out.outside = true; if (!outside.has(z)) outside.set(z, []); outside.get(z).push(`object ${oid} ${objects[oid]?.name ?? ""}`.trim()); }
		if (onlyElsewhere(p)) p.others.forEach((m) => out.elsewhere.add(instanceName(m)));
	}
	const few = (list) => [...new Set(list)].slice(0, 5).join(", ") + (new Set(list).size > 5 ? ", ..." : "");
	if (bosses.length) out.text.push(...new Set(bosses));
	if (inside.length) out.text.push(`inside: ${few(inside)}`);
	for (const [z, names] of outside) out.text.push(`${zoneName(z)}: ${few(names)}`);
	if (other.size) out.text.push(`other instances: ${[...other].join(", ")}`);
	if (it.vendors?.length) { out.text.push(`vendors: ${it.vendors.slice(0, 3).join(", ")}`); out.outside = true; }
	if (!out.text.length) out.text.push("no source in the data");
	return out;
}

// One objective, numbered as lint counts it (the reference data's order), with where it is done.
function objectiveLines(qid) {
	const dq = quests[qid];
	const list = dq?.objectives ?? [];
	return list.map((o, i) => {
		const n = o.count && o.count > 1 ? ` x${o.count}` : "";
		const head = `${qid}.${i + 1} ${o.type} ${o.id ?? ""} "${o.text ?? ""}"${n}`.replace(/  +/g, " ");
		let where = "", inside = false, elsewhere = [];
		if (o.type === "kill" || o.type === "talk") {
			where = npcText(o.id);
			const p = placeOf(npcs[o.id]);
			inside = p.inside || bossByNpc.has(o.id);
			if (onlyElsewhere(p)) elsewhere = p.others.map(instanceName);
		} else if (o.type === "item") {
			const s = itemSources(o.id);
			where = s.text.join("; ");
			inside = s.inside && !s.outside;
			elsewhere = [...s.elsewhere];
		} else if (o.type === "object") {
			where = objectText(o.id);
			const p = placeOf(objects[o.id]);
			inside = onlyInside(p) || bossByObject.has(o.id);
			if (onlyElsewhere(p)) elsewhere = p.others.map(instanceName);
		} else {
			where = "event";
		}
		return { text: `${head}: ${where}`, inside, elsewhere };
	});
}

function factionOf(mask) {
	if (mask == null) return "both";
	let a = 0, h = 0;
	for (const [, sides] of Object.entries(races)) {
		for (const [side, r] of Object.entries(sides)) if ((mask & r.bit) || (r.bit > 2 ** 31 && Math.floor(mask / r.bit) % 2)) side === "Alliance" ? a++ : h++;
	}
	return a && !h ? "A" : h && !a ? "H" : "both";
}
function racesText(mask) {
	if (mask == null) return null;
	const set = [];
	const all = { Alliance: [], Horde: [] };
	for (const [race, sides] of Object.entries(races)) {
		for (const [side, r] of Object.entries(sides)) {
			all[side].push(race);
			const on = r.bit > 2 ** 31 ? Math.floor(mask / r.bit) % 2 === 1 : (mask & r.bit) !== 0;
			if (on) set.push(`${race}/${side}`);
		}
	}
	const sides = ["Alliance", "Horde"].filter((s) => all[s].every((race) => set.includes(`${race}/${s}`)));
	const leftover = set.filter((x) => !sides.includes(x.split("/")[1]));
	if (!leftover.length) return sides.length === 2 ? null : `${sides.join(", ")} races`;
	return set.join(", ");
}
function classesText(mask) {
	if (!mask) return null;
	return Object.entries(CLASS_BITS).filter(([, b]) => mask & b).map(([c]) => c).join(", ");
}

// A quest's lead-ins from the reference data, deepest first, each once.
function leadIns(qid) {
	const order = [], seen = new Set([qid]), oneOf = new Set();
	const walk = (id) => {
		const dq = quests[id];
		if (!dq) return;
		const any = dq.preAny ?? [];
		const pres = [...new Set([...(dq.pre ?? []), ...any, ...(dq.preAll ?? [])])];
		if (any.length > 1) any.forEach((x) => oneOf.add(x));
		for (const p of pres) {
			if (seen.has(p)) continue;
			seen.add(p);
			walk(p);
			order.push(p);
		}
	};
	walk(qid);
	return { order, oneOf };
}

// A lead-in needs this dungeon when it starts inside or its objectives can only be done inside.
function needsDungeon(id) {
	const dq = quests[id];
	if (!dq) return false;
	const startsInside = (dq.start?.npc ?? []).some((n) => onlyInside(placeOf(npcs[n])))
		|| (dq.start?.object ?? []).some((o) => onlyInside(placeOf(objects[o])));
	const objs = objectiveLines(id);
	return startsInside || (objs.length > 0 && objs.every((o) => o.inside));
}
function endsOutside(id) {
	const dq = quests[id];
	if (!dq) return false;
	return (dq.end?.npc ?? []).some((n) => !onlyInside(placeOf(npcs[n])) && placeOf(npcs[n]).zones.length > 0)
		|| (dq.end?.object ?? []).some((o) => placeOf(objects[o]).zones.length > 0);
}

function placeText(p) {
	if (!p) return "?";
	const where = p.inside ? "inside" : p.map ? `${zoneName(p.map)} ${p.x},${p.y}` : "no place";
	return `${p.kind} ${p.id ?? ""} ${p.name ?? ""}, ${where}`.replace(/  +/g, " ");
}
function startItemText(si) {
	if (!si) return "";
	const s = itemSources(si.id);
	const src = s.text.map((t) => t.replace(/^inside: /, "") + (t.startsWith("inside: ") ? " inside" : "")).join("; ");
	return `start item ${si.id} ${si.name ?? ""} from ${src}`;
}
function rewardsText(r) {
	if (!r) return null;
	const parts = [];
	if (r.items?.length) parts.push(r.items.map((i) => `${i.id} ${i.name}${i.choice ? " (choice)" : ""}`).join(", "));
	if (r.xp) parts.push(`${r.xp} xp`);
	if (r.money) parts.push(`${r.money}c`);
	if (r.rep?.length) parts.push(r.rep.map((x) => `${x.name} ${x.value}`).join(", "));
	return parts.length ? parts.join("; ") : null;
}

function questBlock(q, side, out) {
	const dq = quests[q.id];
	const flags = [];
	if (!shipped.has(q.id)) flags.push("NOT-IN-SHIPPED-DATA");
	const objs = objectiveLines(q.id);
	const elsewhere = new Set(objs.flatMap((o) => o.elsewhere));
	const { order, oneOf } = leadIns(q.id);
	for (const l of order) objectiveLines(l).forEach((o) => o.elsewhere.forEach((x) => elsewhere.add(x)));
	if (elsewhere.size) flags.push(`OTHER-INSTANCE ${[...elsewhere].join(", ")}`);
	const trip = order.find((l) => needsDungeon(l) && endsOutside(l));
	if (trip) flags.push(`RETURN-TRIP after ${trip} ${quests[trip]?.title ?? ""}`.trim());

	out.push(`\n### ${q.id} ${q.title} (level ${q.level}, from ${q.minLevel ?? "?"}; ${q.faction ? SIDE[q.faction] : "both"})${flags.length ? "  [" + flags.join("] [") + "]" : ""}`);
	const limits = [classesText(dq?.classes) && `classes ${classesText(dq.classes)}`, racesText(dq?.races) && `races ${racesText(dq.races)}`].filter(Boolean);
	if (limits.length) out.push(`- only: ${limits.join("; ")}`);
	out.push(`- giver: ${q.startItem ? startItemText(q.startItem) : placeText(q.start)}`);
	out.push(`- ender: ${placeText(q.finish)}`);
	if (order.length) out.push(`- lead-ins: ${order.join(", ")}${oneOf.size ? ` (one of: ${[...oneOf].join(", ")})` : ""}`);
	if (dq?.next) out.push(`- next: ${dq.next} ${quests[dq.next]?.title ?? ""}`.trimEnd());
	for (const o of objs) out.push(`- ${o.text}`);
	if (!objs.length) out.push("- no objectives (a talk or a delivery)");
	const rw = rewardsText(q.rewards);
	if (rw) out.push(`- rewards: ${rw}`);
	if (dq?.objectiveText) out.push(`- text: ${dq.objectiveText}`);
	return order;
}

function chainLine(id, out) {
	const pc = page.chain?.[id];
	const dq = quests[id];
	const flags = [];
	if (!shipped.has(id)) flags.push("NOT-IN-SHIPPED-DATA");
	const title = pc?.title ?? dq?.title ?? "?";
	const giver = pc ? (pc.startItem ? startItemText(pc.startItem) : placeText(pc.start))
		: dq ? (dq.start?.npc?.length ? npcText(dq.start.npc[0]) : dq.start?.object?.length ? objectText(dq.start.object[0]) : dq.start?.item?.length ? `item ${dq.start.item[0]}` : "no giver in the data") : "?";
	const ender = pc ? placeText(pc.finish) : dq ? (dq.end?.npc?.length ? npcText(dq.end.npc[0]) : dq.end?.object?.length ? objectText(dq.end.object[0]) : "no ender in the data") : "?";
	const fac = pc?.faction ?? factionOf(dq?.races);
	out.push(`- ${id} ${title} (level ${pc?.level ?? dq?.level ?? "?"}; ${SIDE[fac] ?? "both"})${flags.length ? "  [" + flags.join("] [") + "]" : ""}`);
	const limits = [classesText(dq?.classes) && `classes ${classesText(dq.classes)}`, racesText(dq?.races) && `races ${racesText(dq.races)}`].filter(Boolean);
	if (limits.length) out.push(`  - only: ${limits.join("; ")}`);
	out.push(`  - giver: ${giver}`);
	out.push(`  - ender: ${ender}`);
	for (const o of objectiveLines(id)) out.push(`  - ${o.text}`);
	const rw = rewardsText(pc?.rewards);
	if (rw) out.push(`  - rewards: ${rw}`);
}

function sideSection(side) {
	const out = [];
	const ent = page.entrance ?? summary.entrance;
	out.push(`# ${summary.name} (${opts.key}): ${SIDE[side]}`);
	out.push(`- levels ${summary.minLevel}-${summary.maxLevel} (floor ${summary.floor}), ${summary.players} players${summary.playersMax ? ` (up to ${summary.playersMax})` : ""}, instance map ${map}, zone ${summary.zoneName ?? zoneName(summary.zone)} (${summary.zone})`);
	out.push(`- entrance: ${ent ? `${zoneName(ent.map)} ${ent.x},${ent.y}` : "none in the data"}`);
	if (CITY[opts.key] && CITY[opts.key] !== side) out.push(`- CITY-OTHER-SIDE: a city dungeon of the ${SIDE[CITY[opts.key]]}; no ${SIDE[side]} guide`);

	const list = page.quests.filter((q) => !q.faction || q.faction === side);
	out.push(`\n## Quests (${list.length})`);
	const chainIds = new Set();
	for (const q of list) questBlock(q, side, out).forEach((id) => chainIds.add(id));

	const pageIds = new Set(page.quests.map((q) => q.id));
	const chain = [...chainIds].filter((id) => !pageIds.has(id));
	out.push(`\n## Lead-ins (${chain.length})`);
	for (const id of chain) chainLine(id, out);

	out.push(`\n## Bosses (journal order)`);
	for (const b of page.bosses ?? []) {
		const ties = (b.quests ?? []).map((t) => `${t.id} ${t.how}${t.item ? ` item ${t.item}` : ""}`).join(", ");
		out.push(`${b.order}. ${b.name} (${b.npc ? `npc ${b.npc}` : b.object ? `object ${b.object}` : "no id"})${b.role ? ` ${b.role}` : ""}${b.encounter ? ` encounter ${b.encounter}` : ""}${ties ? ` - quests: ${ties}` : ""}`);
	}

	// Quests the data ties to this dungeon (an objective only inside, or a giver or ender inside) that
	// the page does not list for this side.
	const extra = [];
	for (const [idText, dq] of Object.entries(quests)) {
		const id = Number(idText);
		if (pageIds.has(id) || chainIds.has(id)) continue;
		const fac = factionOf(dq.races);
		if (fac !== "both" && fac !== side) continue;
		const objs = objectiveLines(id);
		const tied = objs.some((o) => o.inside) || [...(dq.start?.npc ?? []), ...(dq.end?.npc ?? [])].some((n) => onlyInside(placeOf(npcs[n])));
		if (tied) extra.push(id);
	}
	out.push(`\n## Tied to this dungeon by the data but not on the page (${extra.length})`);
	for (const id of extra) chainLine(id, out);
	return out.join("\n");
}

const sides = opts.faction ? [opts.faction] : ["A", "H"];
console.log(sides.map(sideSection).join("\n\n"));
