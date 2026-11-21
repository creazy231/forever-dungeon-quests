# Every dungeon in Forever Dungeon Quests: design

Date: 2026-11-21. Pack: `forever-dungeon-quests` (public on polestar.guide since 2.0.0, which holds
The Drowned City only).

## Intent

The user wants the pack to hold every dungeon of WoW Forever, built like The Drowned City: per
dungeon and faction, one guide that runs the whole lead-in chain, picks up every quest of the
dungeon, enters the dungeon, goes through it boss by boss with each quest goal where it comes,
and hands everything in. They asked for it to be done one dungeon at a time.

Why: one fixed route per dungeon that gets every quest done in one visit, as a community addon
next to Polestar's own Dungeons window (which plans pick-ups and hand-ins per character but has
no route through the dungeon).

## Decided by the user

- **Scope: every dungeon in the game**, 27 besides The Drowned City: WoW Forever's eight other
  new dungeons first, then the 19 classic dungeons in level order. Raids stay out.
- **Shape: as The Drowned City** (`guides/drowned-city-horde.guide`, `-alliance.guide`).
- **One dungeon at a time.**

## Goals

- Per dungeon: a Horde and an Alliance guide (exceptions below), each a complete route from the
  first lead-in to the last hand-in, with one run inside.
- Every fact checkable in Polestar's reference data, the client's tables or players'
  recordings; the user's own recorded runs where they exist.
- Each dungeon finished (lint, playtest, install, commit) before the next one starts, so the
  user can try each in game as it lands.

## Non-goals

- Raids (Onyxia's Lair, Molten Core, Zul'Gurub, Ruins of Ahn'Qiraj, Blackwing Lair, Ahn'Qiraj
  Temple, Naxxramas).
- Changes to Polestar itself or a PR. Rule since issue #2841: new guides are community guides.
- Uploading to polestar.guide. That waits for the user's go (see Publishing).

## Anti-goals (a failure even if it works)

- Any fact, route, tip or boss note taken from a website, another guide or another addon
  (Wowhead, wikis, walkthroughs, ForeverDungeonJournal, Zygor, Polestar's own guide text). The
  pack's README, AGENTS.md and polestar.guide's content rules forbid it.
- Guessed ids, names or coordinates. Every one is looked up (Codex page, `polestar find`).
- A guide that sends a character into an enemy capital.
- Changing the ids of the published Drowned City guides.

## Constraints

- Polestar 0.4.1.1 is installed. The local toolchain is a clone at v0.4.1.1 with forge built and
  data built from QuestieDB Forever 1.1.4, in the session scratchpad (`tc/polestar`). Its data
  build needed one more corrections-overlay entry (quest 7790's "PvP CTF Credit Marker"). The
  overlay is a scratchpad copy; the Zygor pack's own `tools/corrections-overlay.json` is untouched.
- Guide format: Polestar's `docs/GUIDE_FORMAT.md`, summarised in
  `.claude/skills/polestar-guide-pack/references/guide-format.md`.
- Polestar has no maps inside dungeons. Inside goals stand at the outside entrance (`@x,y`) with
  `group 5` (`group 10` for Upper Blackrock Spire), the convention GUIDE_FORMAT.md names and The
  Drowned City uses. Arrival is `enter "<Dungeon>" @door`, written as the client names the
  instance.
- The polestar.guide upload accepts only source files (pack.json, .guide, README, LICENSE,
  images). Scripts must never go into the upload zip.

## Approaches

1. **Data worksheet plus hand-written guides, one dungeon at a time (chosen).** A script reads
   the dungeon's Codex page and the reference data and prints a worksheet per faction. The guides
   are written from it by hand, in our own words. Fast enough for ~800 quests, keeps ids exact,
   reads like The Drowned City.
2. **Full generator.** Writes every guide from the data in one go, then fixes what lint flags.
   Fastest, but routes and tips read like machine output, every dungeon still needs a hand pass,
   and it works against "one at a time".
3. **By hand without a worksheet**, every quest looked up with `polestar find` as for The
   Drowned City. Same result as 1, several times slower, more wrong-id risk.

The user handed over the how; approach 1 is my call.

## My calls (the user can overrule any)

### Which quests a dungeon's guide holds

- **The base list:** the quests Polestar's Codex page lists for the dungeon and that side
  (`Dungeons.Quests(key, faction)`), with each one's lead-in chain (the page's `chain`), and a
  follow-up when its giver is the quest's own ender and it needs no other dungeon.
- **"Everything you can pick up before one run."** A quest is left out when finishing its chain
  needs another dungeon, a raid, a reputation grind or a world event. Examples: Lord Valthalak's
  amulet and the Dungeon Set 2 chains (Stratholme, Scholomance, Blackrock Spire, Dire Maul), the
  Onyxia and Molten Core attunement chains, the warlock and paladin epic mount chains. Also left
  out: repeatable quests. Each guide's header and the README name what was left out and why.
- **Class and race quests stay in**, behind `only <Class>` / `only <Race>` on their steps or
  goals.
- **Return trips (decided by the user, 2026-11-21: a second run at the end).** Some follow-ups
  send you back into the same dungeon after a hand-in outside. Examples: Gnomeregan's 2962 The
  Only Cure is More Green Glow after 2926 Gnogaine, Blackrock Depths' 4362 The Fate of the
  Kingdom after 4361 The Bearer of Bad News, Scholomance's 5384 Kirtonos the Herald after 5515
  Krastinov's Bag of Horrors. Such a guide goes back in after the hand-ins for those follow-ups
  and hands them in too. The README's and listing's "one run" becomes "one run, a second only
  where a follow-up sends you back in".
- **Quests that start inside** (an NPC there, or an item a mob or object drops) are accepted in
  the run step where they come and handed in afterwards. A quest whose start the data does not
  place is named in the run's tip, as GUIDE_FORMAT.md says.

### Which guides a dungeon gets

- One per side that has quests. A side with none gets no guide (Ragefire Chasm has none for the
  Alliance, the Stockade none for the Horde).
- **City dungeons belong to their own faction**, as in Polestar: Ragefire Chasm and the Ruins of
  Lordaeron get only a Horde guide, The Hall of Thanes and the Stockade only an Alliance one.
  Their entrances are in or by the other side's capital. The other side's quests there are left
  out, and the README says so.

### The run

- **Boss by boss, in the order of the client's DungeonEncounter table** (the Codex page's
  `bosses`, in their `order`). Each boss step holds the quest goals tied to that boss
  (`kill` objectives, the items it drops, the quests its drop starts). Bosses without a quest
  goal get a step only when the order needs a landmark: a bare optional `kill` with a short tip.
- The client's order is the dungeon journal's, not always the walking order: the user's recorded
  City of Dalaran run met Atrexis and Lyn first and Mana Devourer last, which the journal lists
  third. So every quest goal is one the quest log counts (`quest Q.O`), and a group that takes
  the bosses in another order still gets each step ticked when it comes up. Landmark kills stay
  `optional`, and tips never claim "next you reach X" without a recording behind it.
- **Trash drops and kill counts** that are not tied to one boss go in an `along until <hand-in>`
  step (as the Alliance Drowned City guide does with the fetishes), or into the boss step where
  the data puts the mobs.
- **Where the user has a recorded run** (Razorfen Kraul, Scarlet Monastery, Razorfen Downs,
  Excavation Site: Wetlands, City of Dalaran; all Horde), the run steps follow the recording.
  Its encounters, kills and loot give the order and what dropped where, and the header says
  "a run of my own".
- **Wing dungeons** (Scarlet Monastery, Dire Maul, Stratholme, Blackrock Spire, Maraudon): one run
  section per wing, in level order, each starting at that wing's door where the data or
  recordings give one, else at the dungeon's entrance. Upper Blackrock Spire's goals use
  `group 10`.
- **Tips** say only what the data backs: who, where, which boss or mob drops what, the group size
  and levels (GroupFinderActivity via the Codex page). Short, in our own words, the Drowned City's
  tone.

### Entrances

- The Codex entrance (players' recordings in `data/codex/entrances.json`) is the `@door`.
- Blackmaw Hold and Shaper's Terrace have no door in any source checked on 2026-11-21: not in
  entrances.json (v0.4.1.1 or Polestar's `next`), and not in the client's tables either (their
  Map rows have no corpse point, and AreaPOI has no pins for them). Polestar's own notes say
  "No entrance in our data". Their guides name the zone and write `enter "<Dungeon>"` without a
  point. Inside goals carry no `@`, unless lint or playtest demand a place, in which case they
  go at the zone's flight point with the tip saying the door is unknown. Each guide gets an
  `INGAME:` question asking where the door is. A run of the user's own fills it in later.

### The three website drafts

Alcaz Prison, Blackmaw Hold and Shaper's Terrace are rewritten from data like every other
dungeon, under the public pack's ids. Once all three are in, the private drafts pack moves to
`PolestarPacks/_archive/`. Its installed folder `PolestarPack_forever-dungeon-drafts` moves out of
AddOns into the same archive, so the guides don't show twice. Both moves are reversible.

### Per-dungeon delivery

- Files `guides/<dungeon>-<faction>.guide`, ids `forever-dungeon-quests/<dungeon>-<faction>`,
  `category Dungeons`, `folder <the dungeon's name>`, `levels` from the Codex page. The header
  covers the chain, what was left out, the sources and any `INGAME:` questions, as in the Drowned
  City guides.
- Checks: `forge guide lint` with 0 errors and every warning fixed or explained in the header;
  `polestar playtest` passing for every guide of the pack.
- README: the table row and a short section per dungeon. LISTING.md: the dungeon list and
  changelog line. `pack.json`: the minor version goes up one per dungeon (2.1.0, 2.2.0, ...).
- Installed into AddOns with `polestar install --pack . --dest ...`, after checking SyncCraft is
  not mid-sync, and checked again a few minutes later.
- One commit per dungeon in the pack repo, as creazy231 (repo-local identity) with the
  Co-Authored-By trailer, as the existing commits have.
- The worksheet script lives in the pack repo at `tools/worksheet.mjs`. It is not part of the
  upload zip, which lists its files explicitly.

### Quest data versions

The toolchain builds on QuestieDB 1.1.4. The installed Polestar 0.4.1.1 ships older quest data,
and polestar.guide builds uploads with its own data, which is older again. About 160 quests exist
only in the newer data, among them 95056 "Krol'dok No More!" and 86814 "Blackmaw
Counter-Offensive". The worksheet flags every quest the installed Polestar's data lacks. Those
quests are written self-contained: the title in quotes, `npc <id>` on accepts and turn-ins, and
typed `@x,y` from the newer data. The guide then reads the same whatever data builds it. Local
installs are compiled with the toolchain's data either way. Before any upload, the site's build
report is checked for notes on them.

### Pack identity

Title and id stay. README and listing change from "WoW Forever's new dungeons" to every dungeon
in WoW Forever. The Drowned City's guides stay as they are.

### Publishing

No upload until the user says so. At the end of the Forever block (8 dungeons) and at the very
end, the upload zip is built (`dist/forever-dungeon-quests-<version>-upload.zip`: pack.json,
README.md, LICENSE, guides/) and the listing texts are updated, ready to upload. Before any
upload, check on the index whether 2.0.0 passed moderator review.

## Order

Forever: The Hall of Thanes (13-18), Ruins of Lordaeron (15-22), Excavation Site: Wetlands (26-33),
City of Dalaran (28-35), Krol'dok Stronghold (40-47), Alcaz Prison (48-55), Blackmaw Hold (55-60),
The Shaper's Terrace (60).

Classic: Ragefire Chasm, The Deadmines, Wailing Caverns, Shadowfang Keep, Blackfathom Deeps, The
Stockade, Gnomeregan, Razorfen Kraul, Scarlet Monastery, Razorfen Downs, Uldaman, Zul'Farrak,
Maraudon, Sunken Temple, Blackrock Depths, Dire Maul, Blackrock Spire, Stratholme, Scholomance.

## Left to the builder

- The order of stops outside (by place and level, walking each zone once), the step titles, and
  how a dungeon's lead-ins interleave.
- Where a long or high-level lead-in needs a `level N` wait (side-guide rule: mobs at most 1 above
  the character, 2 for group goals).
- How exactly a wing dungeon's sections and doors are written, within the rules above.
- Wording of every tip and header.
