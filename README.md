# The Drowned City Quests

A community addon for [Polestar](https://polestar.guide), the guide addon for
World of Warcraft: Forever. It takes every quest of the Drowned City, WoW
Forever's sunken dungeon under the Vile Reef in Stranglethorn Vale, in one
guide per faction: the lead-ins, the pick-ups, one run through the dungeon,
boss by boss, and every hand-in. It is a separate addon by creazy231; it is
not made or supported by Polestar.

## What it does

- **Every quest in one route.** The Horde guide starts with Kin'weelay at
  Grom'gol, the Alliance guide with Sergeant Yohwa at the Rebel Camp. Both go
  on to the last hand-in.
- **Picks up where you are.** Steps you have already done are passed over,
  so the guide starts wherever your chain stands.
- **One run.** Every quest that needs the dungeon is in your log before you
  go in: Krazek's two in Booty Bay, and the idol quest (from Mazu'kon in
  Mulgore for the Horde, from Archmage Timear in Dalaran for the Alliance).
  The idol only drops while that quest is in your log.
- **Boss by boss.** Inside, the steps follow the bosses in the order of a
  recorded run: Zul'Alai, Var'Taka, Captain Dreadrise, the Deathless
  Guardians, Min'loth. Each step says which tablet, kill or drop comes there.

## The guides

In Polestar's guide menu (`/polestar guides`), under **Community guides** >
**The Drowned City Quests**, folder **The Drowned City**:

| Guide | Starts at | Takes you to |
|---|---|---|
| The Drowned City (Horde) | Kin'weelay, Grom'gol Base Camp | Booty Bay, Mulgore, the dungeon, Sen'jin Village |
| The Drowned City (Alliance) | Sergeant Yohwa, the Rebel Camp | Southshore, Dalaran, Booty Bay, the dungeon, Ironforge |

Both are for levels 35 to 40. The Alliance guide waits for level 39 before
Troll Witchery, whose Skullsplitter trolls are level 39 to 42.

## In the dungeon

- The Drowned City is for five players of level 35 to 42. Its entrance is in
  Sunken Hollow, under the Vile Reef, due west of Grom'gol: swim west from
  the shore. Water breathing helps.
- Polestar has no map of the inside, so the arrow points at the entrance for
  every goal in there. Where exactly the tablets stand inside is still open:
  if you know, tell me.
- One pass through the pirates may give fewer than ten artifacts for Shady
  Saltseers. Krazek takes the quest whenever you have them.

## Next to Polestar's Dungeons window

Polestar has a page for the Drowned City in its Dungeons window
(`/polestar dungeons`, since Polestar 0.4.0), with a pick-up guide and a
hand-in guide planned for your character. This addon gives you the same
quests as one fixed route per faction, from the first lead-in to the last
hand-in, with the run in between.

These two guides were first written for Polestar itself, which carries them
in version 0.4.1 under Miscellaneous. If your Polestar lists them there too,
they are the same guides. This addon is where they get their updates.

## Install

- **Polestar Client:** open **Community**, find **The Drowned City Quests**
  and press **Install**.
- **By hand:** unzip the release into the game's `Interface/AddOns/` folder,
  next to the `Polestar` folders, so that
  `Interface/AddOns/PolestarPack_drowned-city-quests` exists.

Restart the game the first time (a `/reload` does not load a new addon).
**Options > Community guides** (`/polestar packs`) turns the addon on or off.

## Problems and ideas

Report a wrong step to creazy231 on the addon's page,
<https://polestar.guide/community/drowned-city-quests>, not to Polestar.

## Where the facts come from

Every quest, NPC, item and reward comes from the game's data as Polestar's
reference data holds it (QuestieDB Forever). The entrance, the tablets' loot
and the idol's drop come from players' recordings collected by Polestar, and
the dungeon's size, levels and bosses from the game client's own tables. The
way through the dungeon comes from a run of my own on 2026-11-15, recorded
with Polestar's recorder. Nothing comes from websites or other guides.

Credits: creazy231. Licence: CC-BY-4.0 (see `LICENSE`).

## For authors

The addon is built from this folder: `pack.json` and the two `.guide` files
in `guides/`, in Polestar's guide format. With a Polestar clone (Node 24+,
Lua 5.1, its `forge` built and its reference data built), from this folder:

- `forge guide lint`: checks the guides against the game's data.
- `polestar playtest`: plays every guide to the end.
- `polestar install --pack . --dest <AddOns folder>`: copies it into the game.
- `forge release pack`: writes the release zip to `dist/`.

The guides use quests that QuestieDB Forever has from version 1.1.1 on:
reference data built from an older one lacks nine of them. Raise `version`
in `pack.json` for every release.
