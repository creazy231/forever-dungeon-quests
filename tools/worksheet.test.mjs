// Tests for tools/worksheet.mjs and tools/runlog.mjs: run with `node --test tools/`.
// They read the installed Polestar_Codex and Polestar_QuestDB ($ADDONS), the toolchain's reference
// data ($PS_CLONE/data/forever) and the user's recorder uploads, so they check real facts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const run = (script, args) => execFileSync("node", [path.join(here, script), ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
const worksheet = (key, faction) => run("worksheet.mjs", [key, "--faction", faction]);

// The lines of one quest's block: from its "### <id> " heading to the next heading.
function questBlock(text, id) {
	const start = text.indexOf(`\n### ${id} `);
	assert.notEqual(start, -1, `no block for quest ${id}`);
	const next = text.indexOf("\n### ", start + 1);
	return text.slice(start, next === -1 ? undefined : next);
}

test("hall of thanes alliance: the head quest, its lead-in and its boss drop", () => {
	const ws = worksheet("the-hall-of-thanes", "A");
	const q = questBlock(ws, 96393);
	assert.match(q, /Old Ironforge Incursion/);
	assert.match(q, /lead-ins: 96391/);
	assert.match(q, /96393\.1 item 274286 "Durgen Dirgehammer's Head".*boss Durgen Dirgehammer/);
});

test("hall of thanes alliance: the treaty quest starts from an item an object inside drops", () => {
	const q = questBlock(worksheet("the-hall-of-thanes", "A"), 98423);
	assert.match(q, /start item 281030 .*object 673474 .*inside/);
});

test("hall of thanes horde: a city dungeon of the other side is flagged", () => {
	assert.match(worksheet("the-hall-of-thanes", "H"), /CITY-OTHER-SIDE/);
});

test("drowned city horde: the four rubbings and the bosses in journal order", () => {
	const ws = worksheet("the-drowned-city", "H");
	const q = questBlock(ws, 95775);
	[270308, 270309, 270310, 270311].forEach((item, i) => assert.match(q, new RegExp(`95775\\.${i + 1} item ${item} `)));
	const bosses = ws.slice(ws.indexOf("## Bosses"));
	const order = ["Zul'Alai", "Var'Taka", "Captain Dreadrise", "Deathless Guardians", "Primeval Elemental", "Min'loth the Serpent"].map((b) => bosses.indexOf(b));
	assert.ok(order.every((at) => at > 0), `a boss is missing: ${order}`);
	assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("scholomance: a follow-up whose lead-in needs the dungeon is a return trip", () => {
	// 5515 Krastinov's Bag of Horrors: the bag drops only from Jandice Barov inside; it is handed in
	// on Caer Darrow, and only then is 5384 Kirtonos the Herald offered.
	assert.match(questBlock(worksheet("scholomance", "A"), 5384), /RETURN-TRIP/);
});

test("gnomeregan alliance: a lead-in that can be done outside is no return trip", () => {
	// 2926 Gnogaine's phial also drops from Irradiated Invaders in Dun Morogh, outside.
	assert.doesNotMatch(questBlock(worksheet("gnomeregan", "A"), 2962), /RETURN-TRIP/);
});

test("quests the shipped data lacks are flagged", () => {
	// 86814 Blackmaw Counter-Offensive is only in the newer data (QuestieDB 1.1.4).
	const ws = worksheet("blackmaw-hold", "H");
	if (ws.includes("\n### 86814 ")) assert.match(questBlock(ws, 86814), /NOT-IN-SHIPPED-DATA/);
	assert.doesNotMatch(questBlock(worksheet("the-drowned-city", "H"), 95775), /NOT-IN-SHIPPED-DATA/);
});

test("runlog: the recorded Drowned City run met its bosses in order", () => {
	const log = run("runlog.mjs", ["2970"]);
	const visits = log.split("\n## ").slice(1);
	const encounters = visits.map((v) => [...v.matchAll(/encounter (\d+) kill/g)].map((m) => Number(m[1])));
	assert.ok(encounters.some((e) => e.join(",") === "3474,3475,3476,3478,3479"), JSON.stringify(encounters));
	assert.ok(visits.some((v) => v.startsWith("2026-11-15")));
});

test("vendors are named with their zones, all of them", () => {
	// Essence of Agony (8923) for 97291: the Undercity's Ezekiel Graves is one of many sellers.
	const q = questBlock(worksheet("ruins-of-lordaeron", "H"), 97291);
	assert.match(q, /97291\.3 item 8923 .*Ezekiel Graves \(npc 4585\) in Undercity/);
});

test("runlog: times inside a visit never go backwards (dt is tenths of a second)", () => {
	const log = run("runlog.mjs", ["2998"]);
	for (const v of log.split("\n## ").slice(1)) {
		const times = [...v.matchAll(/^- (\d{4}-\d\d-\d\d \d\d:\d\d:\d\d) /gm)].map((m) => m[1]);
		assert.deepEqual([...times].sort(), times, v.slice(0, 200));
	}
});

test("excavation site alliance: a delivery after the relic is no return trip", () => {
	// 98824 Prehistoric Prism follows 95810 (the relic drops inside) but needs nothing inside.
	assert.doesNotMatch(questBlock(worksheet("excavation-site-wetlands", "A"), 98824), /RETURN-TRIP/);
});

test("a dropper with no place in the data is still named", () => {
	// The Eye of Mugg (267086) drops from Overlord Mugg, whom the data places nowhere.
	assert.match(questBlock(worksheet("kroldok-stronghold", "H"), 94968), /94968\.1 item 267086 .*Overlord Mugg \(npc \d+\), no place/);
});

test("a door on a map whose era and Forever frames differ is flagged", () => {
	assert.match(worksheet("stormwind-stockade", "A"), /FRAME-DIFF/);
	assert.doesNotMatch(worksheet("the-hall-of-thanes", "A"), /FRAME-DIFF/);
});
