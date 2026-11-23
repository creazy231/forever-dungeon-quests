-- Portuguese (Brazil) (ptBR): the guide forever-dungeon-quests/zulfarrak-alliance (guides/zulfarrak-alliance.guide).
-- Written by `forge i18n guides sync ptBR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Portuguese (Brazil) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- A token marked "no name in this language" would show in English: write that name in Portuguese (Brazil) words instead.
-- The comments are rewritten by sync.
return {
	-- Guide
	-- {area:978} Zul'Farrak
	["{area:978} (Alliance)"] = "{area:978} (Aliança)",
	-- {area:978} Zul'Farrak
	["Every Alliance quest of {area:978} in one run, lead-ins included."] = "Todas as missões da Aliança de {area:978} numa única passagem, com as preliminares.",

	-- Step 1: Jennea Cannon
	-- {zone:1453} Stormwind
	["In {zone:1453}."] = "Em {zone:1453}.",

	-- Step 4: Archmage Lan'dalock
	-- {area:279} Dalaran
	["In {area:279}."] = "Em {area:279}.",

	-- Step 5: Gryphon Master Talonaxe
	-- {area:348} Aerie Peak
	["At {area:348}."] = "Em {area:348}.",

	-- Step 6: Witherbark Cages
	["Check the cages at the two Witherbark villages."] = "Verifique as jaulas nas duas vilas dos Cascasseca.",

	-- Step 9: The Altar of Zul
	-- {item:9239} Mallet of Zul'Farrak · {npc:7996} Qiaga the Keeper · {item:9241} Sacred Mallet · {area:354} Jintha'Alor · {quest:2770} Gahz'rilla
	["Check the top of the altar. It is full of elites: bring help. If no one in your group has the {item:9239}: {npc:7996}, the elite on top, drops the {item:9241}; used at the altar at the very top of {area:354} it becomes the Mallet, which calls {quest:2770}."] = "Verifique o topo do altar. Ele está cheio de elites: leve ajuda. Se ninguém do seu grupo tem {item:9239}: {npc:7996}, o elite no topo, deixa cair {item:9241}; usada no altar bem no alto de {area:354}, ela se torna o Malho, que chama {quest:2770}.",

	-- Step 12: Krazek
	-- {area:35} Booty Bay
	["In {area:35}."] = "Em {area:35}.",

	-- Step 14: Tran'rek
	-- {area:976} Gadgetzan
	["In {area:976}."] = "Em {area:976}.",

	-- Step 17: Yeh'kinya
	-- {area:977} Steamwheedle Port
	["In {area:977}."] = "Em {area:977}.",

	-- Step 18: Wizzle Brassbolts
	-- {area:439} Shimmering Flats
	["In the {area:439}."] = "Em {area:439}.",

	-- Step 19: Screecher Spirits
	-- {item:10699} Yeh'kinya's Bramble
	["Use {item:10699} to capture the spirits of three screechers."] = "Use {item:10699} para capturar os espíritos de três gritadores.",

	-- Step 22: To Zul'Farrak
	-- {area:978} Zul'Farrak
	["To {area:978}"] = "Para {area:978}",
	["A dungeon for five players of level 44 to 54."] = "Uma masmorra para cinco jogadores de nível 44 a 54.",

	-- Step 23: Troll Temper and shells
	-- {quest:3042} Troll Temper
	["{quest:3042} and shells"] = "{quest:3042} e carapaças",
	-- {quest:3042} Troll Temper
	["The Sandfury trolls drop {quest:3042}."] = "Os trolls Furiarenosa deixam cair {quest:3042}.",
	["From the Scarabs."] = "Dos Escaravelhos.",
	-- plural, as words: Zul'Farrak Zombies = {npc:7286} Zul'Farrak Zombie · Shallow Graves = {object:1599} Shallow Grave
	["From the Zul'Farrak Zombies and the Shallow Graves."] = "Dos Zumbis de Zul'Farrak e das Covas Rasas.",
	-- {item:8623} OOX-17/TN Distress Beacon · {quest:351} Find OOX-17/TN!
	["A rare drop: the {item:8623} starts {quest:351}"] = "Um saque raro: {item:8623} inicia {quest:351}",

	-- Step 24: Hydromancer Velratha
	-- {quest:2846} Tiara of the Deep · {item:10661} Second Mosh'aru Tablet
	["The first encounter in the client's journal. Velratha drops the {quest:2846} and the {item:10661}."] = "O primeiro encontro no diário de masmorras do jogo. Velratha deixa cair {quest:2846} e {item:10661}.",

	-- Step 25: Gahz'rilla
	-- {quest:2770} Gahz'rilla · {item:9239} Mallet of Zul'Farrak
	["{quest:2770} comes only when the gong by the sacred pool is rung with the {item:9239}; one mallet does it for the group."] = "{quest:2770} só aparece quando o gongo ao lado da piscina sagrada é tocado com {item:9239}; um malho serve para o grupo todo.",

	-- Step 26: Theka the Martyr
	-- {npc:8127} Antu'sul · {item:10660} First Mosh'aru Tablet
	["After {npc:8127} in the client's journal. Theka drops the {item:10660}."] = "Depois de {npc:8127} no diário de masmorras do jogo. Theka deixa cair {item:10660}.",

	-- Step 29: Sergeant Bly
	-- {npc:7604} Sergeant Bly · {quest:2768} Divino-matic Rod
	["{npc:7604} carries the {quest:2768}."] = "{npc:7604} carrega {quest:2768}.",

	-- Step 30: Before you leave
	["Before you leave"] = "Antes de partir",
	-- {quest:3042} Troll Temper
	["Whatever is still short of the {quest:3042} and the shells, finish it before you go."] = "O que ainda faltar de {quest:3042} e das carapaças, termine antes de ir embora.",

	-- Step 34: The Distress Beacon
	["The Distress Beacon"] = "O Sinalizador de Socorro",

	-- Step 37: Rescue OOX-17/TN!
	-- {area:977} Steamwheedle Port
	["Escort OOX-17/TN to {area:977}."] = "Escolte OOX-17/TN até {area:977}.",

	-- Step 42: Thadius Grimshade
	["Then wait until Grimshade performs the ritual of divination."] = "Depois espere até Grimshade realizar o ritual de adivinhação.",
}
