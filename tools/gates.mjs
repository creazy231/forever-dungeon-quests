// Finds steps whose `when` stops holding because of one of the step's own goals:
// a `turnin Q` under `when onquest Q` or `when complete Q`, or an `accept Q` under
// `when available Q`, with another goal after it. The engine leaves such a step as
// soon as the condition fails, so the goals after it are never seen.
// usage: node tools/gates.mjs [guide files...]   (default: every guide in guides/)
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const NOT_GOALS = /^(when|tip|zone|only|along|label|#)\b/;

export function selfCancellingSteps(text) {
	const lines = text.split("\n");
	const steps = [];
	lines.forEach((raw, i) => {
		if (raw.startsWith("step ")) steps.push({ line: i + 1, body: [] });
		else if (steps.length && /^\s+\S/.test(raw)) steps[steps.length - 1].body.push(raw.trim());
	});
	const found = [];
	for (const step of steps) {
		const gates = { onquest: new Set(), complete: new Set(), available: new Set() };
		for (const l of step.body) {
			const m = l.match(/^when\s+(onquest|complete|available)\s+([\d,]+)/);
			if (m) m[2].split(",").forEach((q) => gates[m[1]].add(q));
		}
		const goals = step.body.filter((l) => !NOT_GOALS.test(l));
		goals.forEach((g, i) => {
			if (i === goals.length - 1) return;
			const [verb, q] = g.split(/\s+/);
			let gate = null;
			if (verb === "turnin" && gates.onquest.has(q)) gate = `onquest ${q}`;
			else if (verb === "turnin" && gates.complete.has(q)) gate = `complete ${q}`;
			else if (verb === "accept" && gates.available.has(q)) gate = `available ${q}`;
			if (gate) found.push({ line: step.line, reason: `\`when ${gate}\` fails after \`${g}\`; ${goals.length - 1 - i} goal(s) after it drop` });
		});
	}
	return found;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "guides");
	const files = process.argv.length > 2 ? process.argv.slice(2) : readdirSync(dir).filter((n) => n.endsWith(".guide")).map((n) => join(dir, n));
	let n = 0;
	for (const f of files) for (const o of selfCancellingSteps(readFileSync(f, "utf8"))) { n++; console.log(`${f.split("/").pop()}:${o.line} ${o.reason}`); }
	console.log(`${n} self-cancelling step(s)`);
	process.exitCode = n ? 1 : 0;
}
