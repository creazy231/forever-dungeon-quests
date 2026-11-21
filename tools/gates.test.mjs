// Steps whose `when` stops holding because of the step's own goals: the engine
// leaves such a step the moment the condition fails, and the goals after it drop.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { selfCancellingSteps } from "./gates.mjs";

const guidesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "guides");

test("a turn-in under `when onquest` of the same quest, with a goal after it, is flagged", () => {
	const text = "step Duke\n  when onquest 5262\n  turnin 5262\n  accept 5263\n";
	const found = selfCancellingSteps(text);
	assert.equal(found.length, 1);
	assert.equal(found[0].line, 1);
	assert.match(found[0].reason, /onquest 5262/);
});

test("the same turn-in as the step's last goal is fine", () => {
	assert.deepEqual(selfCancellingSteps("step Duke\n  when onquest 5262\n  turnin 5262\n"), []);
});

test("an accept under `when available` of the same quest, with a goal after it, is flagged", () => {
	const text = "step Kreeg\n  when available 5528\n  level 57\n  accept 5528 @59.2,45.1\n  turnin 5528 @59.2,45.1\n";
	const found = selfCancellingSteps(text);
	assert.equal(found.length, 1);
	assert.match(found[0].reason, /available 5528/);
});

test("a turn-in under `when complete` of the same quest, with a goal after it, is flagged", () => {
	const found = selfCancellingSteps("step Infiltrator\n  when complete 4742\n  turnin 4742\n  accept 4743\n");
	assert.equal(found.length, 1);
	assert.match(found[0].reason, /complete 4742/);
});

test("`when turnedin` and goals for other quests are fine", () => {
	const text = "step A\n  when turnedin 5262\n  accept 5263\n  turnin 5263\n\nstep B\n  when onquest 648\n  turnin 649\n  accept 650\n";
	assert.deepEqual(selfCancellingSteps(text), []);
});

test("no guide in the pack has a self-cancelling step", () => {
	const offenders = [];
	for (const f of readdirSync(guidesDir).filter((n) => n.endsWith(".guide"))) {
		for (const o of selfCancellingSteps(readFileSync(join(guidesDir, f), "utf8"))) {
			offenders.push(`${f}:${o.line} ${o.reason}`);
		}
	}
	assert.deepEqual(offenders, []);
});
