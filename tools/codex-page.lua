-- Prints one dungeon's page from the installed Polestar_Codex as JSON, with the dungeon's summary
-- and the quest ids of the installed Polestar_QuestDB (the data the shipped addon has).
--
--   luajit tools/codex-page.lua <Polestar_Codex dir> <dungeon key> [<Polestar_QuestDB dir>]
--   -> {"summary": {...}, "page": {...}, "installedQuestIds": [...]}
--
-- The QuestDB folder defaults to the Codex folder's sibling. Read by tools/worksheet.mjs.

local codexDir, key, questDbDir = arg[1], arg[2], arg[3]
if not (codexDir and key) then
	io.stderr:write("usage: luajit codex-page.lua <Polestar_Codex dir> <dungeon key> [<Polestar_QuestDB dir>]\n")
	os.exit(2)
end
questDbDir = questDbDir or (codexDir:gsub("[/\\]+$", ""):gsub("[^/\\]+$", "Polestar_QuestDB"))

local summaries, sources = {}, {}
Polestar = {
	Dungeons = { Register = function(group, a, b)
		if group == "dungeon" then
			for k, v in pairs(a or {}) do summaries[k] = v end
			for k, v in pairs(b or {}) do sources[k] = v end
		end
	end },
}
dofile(codexDir .. "/Dungeons1.lua")
if not sources[key] then
	io.stderr:write("no dungeon page for key " .. key .. "\n")
	os.exit(1)
end
local page = assert(loadstring(sources[key]))()

-- The installed quest ids: Polestar_QuestDB/Quests.lua holds R("quests", first, last, [[lines]]),
-- one "<id>\t<fields>" record a line.
local ids = {}
Polestar.QuestDB = { AddChunk = function(kind, _, _, text)
	if kind ~= "quests" or type(text) ~= "string" then return end
	for id in text:gmatch("\n(%d+)\t") do ids[#ids + 1] = tonumber(id) end
end, SetMeta = function() end }
dofile(questDbDir .. "/Quests.lua")

-- JSON: a table with keys 1..n only is an array, anything else an object with string keys.
local function isArray(t)
	local n = 0
	for k in pairs(t) do
		if type(k) ~= "number" or k < 1 or k % 1 ~= 0 then return false end
		n = n + 1
	end
	for i = 1, n do if t[i] == nil then return false end end
	return true
end
local escapes = { ['"'] = '\\"', ["\\"] = "\\\\", ["\n"] = "\\n", ["\r"] = "\\r", ["\t"] = "\\t" }
local function encode(v, out)
	local t = type(v)
	if t == "table" then
		if next(v) == nil then out[#out + 1] = "[]" return end
		if isArray(v) then
			out[#out + 1] = "["
			for i, x in ipairs(v) do
				if i > 1 then out[#out + 1] = "," end
				encode(x, out)
			end
			out[#out + 1] = "]"
		else
			local keys = {}
			for k in pairs(v) do keys[#keys + 1] = k end
			table.sort(keys, function(a, b) return tostring(a) < tostring(b) end)
			out[#out + 1] = "{"
			for i, k in ipairs(keys) do
				if i > 1 then out[#out + 1] = "," end
				encode(tostring(k), out)
				out[#out + 1] = ":"
				encode(v[k], out)
			end
			out[#out + 1] = "}"
		end
	elseif t == "string" then
		out[#out + 1] = '"' .. v:gsub('[%c"\\]', function(c) return escapes[c] or string.format("\\u%04x", c:byte()) end) .. '"'
	elseif t == "number" then
		out[#out + 1] = (v % 1 == 0) and string.format("%d", v) or string.format("%.14g", v)
	elseif t == "boolean" then
		out[#out + 1] = tostring(v)
	else
		out[#out + 1] = "null"
	end
end

-- Every dungeon's and raid's instance map, by name, so a worksheet can name another instance.
local instances = {}
for k, s in pairs(summaries) do
	if s.map then instances[tostring(s.map)] = { key = k, name = s.name, kind = s.kind } end
end

local out = {}
encode({ summary = summaries[key], page = page, installedQuestIds = ids, instances = instances }, out)
io.write(table.concat(out), "\n")
