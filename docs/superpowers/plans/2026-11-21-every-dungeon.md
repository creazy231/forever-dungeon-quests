# Every Dungeon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Forever Dungeon Quests gets a quest guide per faction for every dungeon in WoW Forever,
each built like The Drowned City: lead-ins, every pick-up, the run boss by boss, every hand-in.

**Architecture:** `tools/worksheet.mjs` turns a dungeon's Codex page (installed Polestar 0.4.1.1)
plus the toolchain's reference data (QuestieDB 1.1.4) into a worksheet per faction.
`tools/runlog.mjs` lists a recorded run from the user's recorder uploads. Each dungeon's guides
are written by hand from those, checked with forge lint and polestar playtest, installed and
committed, one dungeon per task.

**Tech Stack:** Polestar guide format, forge 0.4.1.1, `polestar` CLI (Node 24), LuaJIT (to read
the Codex), node:test.

**Spec:** `docs/superpowers/specs/2026-11-21-every-dungeon-design.md`

## Global Constraints

- Every fact from Polestar's reference data, the client's tables, players' recordings (Polestar's
  data/codex) or the user's own recorded runs; never from websites, other guides or addons.
- Every id, name and coordinate looked up (worksheet, `polestar find ... --json`), never guessed.
- Guide ids `forever-dungeon-quests/<slug>-horde|alliance`, files `guides/<slug>-<faction>.guide`,
  `category Dungeons`, `folder <the dungeon's name as the client names it>`.
- The Drowned City guides' ids never change.
- Inside goals at the entrance `@x,y` with `group 5` (`group 10` in Upper Blackrock Spire); every
  inside quest goal counted by the quest log (`quest Q.O`); landmark kills `optional`.
- City dungeons only for their own faction: Ragefire Chasm, Ruins of Lordaeron Horde; The Hall of
  Thanes, the Stockade Alliance. No guide for a side with no quests.
- Left out (named in the guide header and README): chains that need another dungeon, a raid, a
  reputation grind or a world event; repeatable quests.
- A follow-up that needs the same dungeon again: a second run after the hand-ins.
- Class and race quests behind `only`.
- Quests the installed Polestar's data lacks: title in quotes, `npc <id>`, typed `@x,y`.
- Commits as the repo-local creazy231 identity with the trailer
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No upload to polestar.guide without the user's go.
- Toolchain: `source "$SP/env.sh"` (scratchpad) sets `PACK`, `PS_CLONE`, `ADDONS`, `PATH` and
  the `polestar` function.

## Review Focus

1. **A quest started by an item or an NPC inside**, which the data places nowhere: the guide must
   accept it in the run step where it comes and name its source in the tip; playtest must not
   fail with "no location".
2. **A character the quest is not for** (class or race quests): only the right characters see
   those steps; playtest runs every class the guide branches on, as every race.
3. **Bosses taken in another order** than the journal's: every inside quest goal ticks from the
   quest log, so the route never holds on a step already done.
4. **Quests the shipped data lacks:** the guide reads the same on data without them (quoted
   title, `npc`, `@`).
5. **The other faction's ground:** no step sends a character to an NPC of the other faction or
   into an enemy capital.

Each dungeon task's checks (Procedure, step D5) cover these: lint, playtest, `--honest` R2-R5
findings, and the grep for flagged quests.

---

### Task 1: The worksheet and run log tools

**Files:**
- Create: `tools/codex-page.lua`: prints one Codex page, plus the installed data's quest ids, as JSON.
- Create: `tools/worksheet.mjs`: the worksheet.
- Create: `tools/runlog.mjs`: a recorded run per instance visit.
- Create: `tools/worksheet.test.mjs`
- Modify: `.gitignore` (nothing to add; the worksheets go to the scratchpad)

**Interfaces:**
- Produces: `luajit tools/codex-page.lua <Polestar_Codex dir> <key>` → stdout JSON
  `{ summary, page, installedQuestIds: [ids] }`. `summary` is the dungeon's summary table, `page`
  its decoded page.
- Produces: `node tools/worksheet.mjs <key> [--faction A|H] [--codex <dir>] [--data <dir>]` →
  Markdown on stdout. Defaults: `$ADDONS/Polestar_Codex` and `$PS_CLONE/data/forever`.
  Per faction:
  - the dungeon's name, levels, players, map, zone and entrance;
  - each quest with its id, title, levels, decoded class and race limits, giver, ender (kind,
    id, name, zone, x,y, inside), start item (and what drops it, inside or out) and lead-ins in
    order;
  - each objective as `Q.N`, its kind, id, name and count, and where it is done: the boss that
    drops it or is killed, trash inside, or outside with the zones of its spawns or droppers;
  - rewards;
  - flags `CITY-OTHER-SIDE`, `OTHER-INSTANCE <name>`, `RETURN-TRIP`, `NOT-IN-SHIPPED-DATA`;
  - the bosses in order with their quest ties, and the 1.1.4-only quests tied to the dungeon's
    NPCs or items.
- Produces: `node tools/runlog.mjs <mapID> [--file <sent.jsonl>]` lists each recorded visit of
  that instance: date, character and level, then in time order the encounters (id and result),
  kills (npc), loot (item ids) and quest progress. The default file is
  `~/Library/Application Support/gg.polestar.client/sent.jsonl`.

- [ ] **Step 1: Write the failing tests** in `tools/worksheet.test.mjs` (node:test, running the
  CLIs with `execFileSync`):
  - `hall of thanes alliance`: the output names quest 96393 with lead-in 96391 and objective
    `96393.1` at boss "Durgen Dirgehammer" (item 274286). It lists 98423 as started by item
    281030 from object 673474 inside.
  - `hall of thanes horde`: the output carries `CITY-OTHER-SIDE`.
  - `drowned city horde`: quest 95775 with objectives `95775.1`-`95775.4` (items 270308-270311),
    and boss order Zul'Alai, Var'Taka, Captain Dreadrise, Deathless Guardians, Primeval Elemental,
    Min'loth the Serpent.
  - `gnomeregan`: 2962 carries `RETURN-TRIP` (lead-in 2926 handed in outside, objective inside).
  - `runlog 2970`: one visit on 2026-11-15 with encounters 3474, 3475, 3476, 3478, 3479 in that
    order.
- [ ] **Step 2: Run** `node --test tools/` and expect every test to fail (the tools are missing).
- [ ] **Step 3: Write `tools/codex-page.lua`.** Load `Dungeons1.lua` with a stub
  `Polestar.Dungeons.Register` (as in the scratchpad's dump script), `loadstring` the page and
  serialise it with a small JSON writer. Collect `installedQuestIds` from `Quests1.lua` and
  `Quests2.lua` the same way (stub their Register; read the file first to find its call shape).
- [ ] **Step 4: Write `tools/worksheet.mjs` and `tools/runlog.mjs`.**
  - Class mask bits: Warrior 1, Paladin 2, Hunter 4, Rogue 8, Priest 16, Shaman 64, Mage 128,
    Warlock 256, Druid 1024.
  - Race bits: Human 1, Orc 2, Dwarf 4, NightElf 8, Undead 16, Tauren 32, Gnome 64, Troll 128,
    Skyborne from the data's `races.json`.
  - `OTHER-INSTANCE`: a chain or follow-up quest with an objective whose npc or item source has
    `instances` other than this map.
  - `RETURN-TRIP`: a follow-up whose lead-in is handed in outside and whose objective is inside
    this dungeon.
  - Record fields for runlog come from Polestar's `docs/RECORDING.md`.
- [ ] **Step 5: Run** `node --test tools/` and expect PASS.
- [ ] **Step 6: Commit**
  `git add tools/ && git commit -m "Tools: dungeon worksheet and recorded-run log"` (plus the trailer).

---

### Procedure for every dungeon task (D1-D8)

- [ ] **D1 Worksheet:** `node tools/worksheet.mjs <key> > "$SP/ws/<key>.md"`, and for a dungeon
  with a recorded run, `node tools/runlog.mjs <map> > "$SP/ws/<key>-run.md"`. Read both.
- [ ] **D2 Decide** sides (city rule, quests per side), what is left out and why, return trips,
  and which quests are flagged `NOT-IN-SHIPPED-DATA`.
- [ ] **D3 Write `guides/<slug>-<faction>.guide`** per side, in the Drowned City's shape:
  - **Header:** `guide`, `title <Dungeon> (<Faction>)`, `category Dungeons`, `folder`,
    `faction`, `levels` from the Codex page, `zone` (the first stop's), `keywords`, the
    `reward item` lines of the main quests, `why`.
  - **Comment block:** the chain; what is left out and why; sources; `INGAME:` questions.
  - **Steps:** lead-ins and pick-ups, walking each zone once and by level; then
    `enter "<Dungeon>" @door` with a tip naming the group size and levels; then one step per
    boss with its quest goals, inside starts accepted where they come, and trash drops in an
    `along until <label>` step; then the hand-ins; then, where needed, the second run and its
    hand-ins.
  - **Words:** our own, short, facts only.
- [ ] **D4 Lint:** `forge guide lint --format json` must give 0 errors. Fix every warning or
  explain it in the guide's comment block.
- [ ] **D5 Playtest:** `polestar playtest` must print ok for every guide in the pack. Then run
  `polestar playtest --honest --filter <slug>`, fix every R2-R5 finding and note any R1 (travel)
  findings, which are expected as for the Drowned City. Then
  `grep -n "<id>" guides/<slug>-*.guide` for each `NOT-IN-SHIPPED-DATA` quest: it needs a quoted
  title, `npc` and `@`.
- [ ] **D6 Texts:**
  - `README.md`: the table row, a section for the dungeon, and the left-out list.
  - `listing/LISTING.md`: the dungeon bullet and a changelog line for the new version.
  - `pack.json`: the next minor version.
- [ ] **D7 Install:**
  1. `pgrep -fil synccraft` and the install's `state` in
     `~/Library/Application Support/app.synccraft.desktop/synccraft-state.json` must show no
     sync in progress.
  2. Run `polestar install --pack . --dest "$ADDONS"`.
  3. Check that `$ADDONS/PolestarPack_forever-dungeon-quests/*.toc` shows the new version, and
     check it again at the next dungeon's D1.
- [ ] **D8 Commit:** `git status` must show only this task's files (another session may touch
  the pack). Then `git add guides/<slug>-*.guide README.md listing/LISTING.md pack.json` and
  commit `<Dungeon>: Horde and Alliance guides (<version>)` with a body listing quests, left-outs
  and checks, plus the trailer.

### Tasks 2-9: WoW Forever's new dungeons (in this order)

| Task | Key | Slug | Sides | Notes |
|---|---|---|---|---|
| 2 | the-hall-of-thanes | hall-of-thanes | Alliance | City dungeon; its one Horde quest is left out. Treaty of Understanding starts inside (object 673474). Version 2.1.0. |
| 3 | ruins-of-lordaeron | ruins-of-lordaeron | Horde | City dungeon; the five Alliance quests are left out. 2.2.0. |
| 4 | excavation-site-wetlands | excavation-site-wetlands | both | Recorded run (map 2998, 2026-11-12). 2.3.0. |
| 5 | city-of-dalaran | city-of-dalaran | both | Recorded run (map 2959, 2026-11-12): order Atrexis, Lyn, Arcane Anomaly, Fel Ancient, Mana Elemental, Unstable Sentinel, Shade, Mana Devourer. 2.4.0. |
| 6 | kroldok-stronghold | kroldok-stronghold | both | 95056 Krol'dok No More! is 1.1.4-only. 2.5.0. |
| 7 | alcaz-prison | alcaz-prison | both | Replaces the drafts' website guide; door 75.4,14.0. 2.6.0. |
| 8 | blackmaw-hold | blackmaw-hold | both | Replaces the draft; no door in any data; 86814 is 1.1.4-only. 2.7.0. |
| 9 | the-shapers-terrace | shapers-terrace | both | Replaces the draft; no door in any data. 2.8.0. After it, Task 10. |

### Task 10: Forever block wrap-up

- [ ] Move `PolestarPacks/forever-dungeon-drafts` and
  `$ADDONS/PolestarPack_forever-dungeon-drafts` into `PolestarPacks/_archive/`, as
  `forever-dungeon-drafts-1.3.0` and `forever-dungeon-drafts-1.3.0-installed`.
- [ ] Rewrite the README intro and the LISTING summary and description for "every dungeon in WoW
  Forever", including the return-trip wording.
- [ ] Build `dist/forever-dungeon-quests-2.8.0-upload.zip` from pack.json, README.md, LICENSE and
  guides/ (`zip -r`), and list its contents to check no tools/ or docs/ went in.
- [ ] Get a fresh review of all Forever guides against the spec (one subagent, read-only), and fix
  what it finds.
- [ ] Commit `Forever block done: README, listing, upload zip 2.8.0`.

### Tasks 11-29: classic dungeons (in this order, Procedure D1-D8 each)

| Task | Key | Slug | Sides | Notes |
|---|---|---|---|---|
| 11 | ragefire-chasm | ragefire-chasm | Horde | City dungeon. |
| 12 | deadmines | deadmines | both | Horde has one quest. |
| 13 | wailing-caverns | wailing-caverns | both | |
| 14 | shadowfang-keep | shadowfang-keep | both | |
| 15 | blackfathom-deeps | blackfathom-deeps | both | |
| 16 | stormwind-stockade | stockade | Alliance | City dungeon. |
| 17 | gnomeregan | gnomeregan | both | Return trip: 2962 after 2926. |
| 18 | razorfen-kraul | razorfen-kraul | both | Recorded run (map 47, 2026-11-12). |
| 19 | scarlet-monastery | scarlet-monastery | both | Wings; recorded runs (map 189, 2026-11-14/15). |
| 20 | razorfen-downs | razorfen-downs | both | Recorded run (map 129, 2026-11-16). |
| 21 | uldaman | uldaman | both | |
| 22 | zulfarrak | zulfarrak | both | |
| 23 | maraudon | maraudon | both | Wings. |
| 24 | sunken-temple | sunken-temple | both | |
| 25 | blackrock-depths | blackrock-depths | both | Return trip: 4362 after 4361. |
| 26 | dire-maul | dire-maul | both | Wings. |
| 27 | blackrock-spire | blackrock-spire | both | Lower and Upper (group 10). |
| 28 | stratholme | stratholme | both | Two sides. |
| 29 | scholomance | scholomance | both | Return trip: 5384 after 5515. |

Versions go on from 2.9.0, one minor step per dungeon.

### Task 30: Wrap-up

- [ ] Rebuild the upload zip for the final version and check its contents.
- [ ] Get a fresh whole-pack review against the spec (one subagent), and fix what it finds.
- [ ] Update the memory files (pack contents, versions, open INGAME questions).
- [ ] Final report to the user: every decision, left-out quests per dungeon, INGAME questions,
  upload readiness.
