import { generateCharacterName } from "./characterNames";
import { generateItem, type Item } from "./items";
import { biomes, castle } from "./tiles";
import { worldHeight, worldWidth } from "./world";

export const maxPartySize = 16;

export const classMarks: Record<
  CharacterClass,
  {
    glyph: string;
    lawful: string;
    lawfulEdge: string;
    evil: string;
    evilEdge: string;
  }
> = {
  warrior: {
    glyph: "⚔",
    lawful: "#ffc8c8",
    lawfulEdge: "#4a1010",
    evil: "#7a1818",
    evilEdge: "#ffd0d0",
  },
  paladin: {
    glyph: "✠",
    lawful: "#ffe7a8",
    lawfulEdge: "#4a3808",
    evil: "#6e5410",
    evilEdge: "#ffe7a8",
  },
  ranger: {
    glyph: "➔",
    lawful: "#d4ffb0",
    lawfulEdge: "#14300a",
    evil: "#1f4d16",
    evilEdge: "#d4ffb0",
  },
  thief: {
    glyph: "⚿",
    lawful: "#e4e4ea",
    lawfulEdge: "#222228",
    evil: "#3c3c46",
    evilEdge: "#ececf2",
  },
  bard: {
    glyph: "♪",
    lawful: "#ffd0ee",
    lawfulEdge: "#4a1436",
    evil: "#6e2054",
    evilEdge: "#ffd0ee",
  },
  mage: {
    glyph: "✶",
    lawful: "#d0e2ff",
    lawfulEdge: "#101e40",
    evil: "#1a3266",
    evilEdge: "#d0e2ff",
  },
  wizard: {
    glyph: "⚚",
    lawful: "#e2d2ff",
    lawfulEdge: "#241044",
    evil: "#3a2270",
    evilEdge: "#e2d2ff",
  },
  cleric: {
    glyph: "✚",
    lawful: "#fff4d4",
    lawfulEdge: "#3a3010",
    evil: "#5c4818",
    evilEdge: "#fff4d4",
  },
  priest: {
    glyph: "☥",
    lawful: "#d8fff4",
    lawfulEdge: "#0e3028",
    evil: "#145448",
    evilEdge: "#d8fff4",
  },
};

const recruitCooldownMs = 10_000;

export const classes = [
  "mage",
  "cleric",
  "thief",
  "ranger",
  "bard",
  "paladin",
  "warrior",
  "wizard",
  "priest",
] as const;

export const races = [
  "human",
  "elf",
  "dwarf",
  "gnome",
  "orc",
  "troll",
  "goblin",
  "kobold",
  "giant",
] as const;

export const skillNames = [
  "recruit",
  "search",
  "pray",
  "gather",
  "dig",
  "mine",
] as const;

export type CharacterClass = (typeof classes)[number];
export type Race = (typeof races)[number];
export type SkillName = (typeof skillNames)[number];
export type Alignment = "lawful" | "evil";

type StatName =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

type StatBlock = Record<StatName, number>;

const lawfulRaces: Race[] = ["human", "elf", "dwarf", "gnome"];
const evilRaces: Race[] = ["orc", "troll", "goblin", "kobold", "giant"];

const classSkills: Record<CharacterClass, Partial<Record<SkillName, number>>> = {
  mage: { recruit: 2, search: 3 },
  cleric: { recruit: 2, pray: 3 },
  thief: { recruit: 1, search: 4 },
  ranger: { search: 2, gather: 3 },
  bard: { recruit: 4 },
  paladin: { recruit: 2, pray: 2, search: 1 },
  warrior: { pray: 1, search: 1, dig: 2, mine: 1 },
  wizard: { search: 1, gather: 4 },
  priest: { pray: 4, search: 1, gather: 1 },
};

const classModifiers: Record<CharacterClass, Partial<StatBlock>> = {
  mage: { intelligence: 2, constitution: -1, strength: -1 },
  cleric: { wisdom: 2, charisma: 1, intelligence: 1, constitution: -2, strength: -2 },
  thief: { dexterity: 2, charisma: 1, wisdom: -2, constitution: -1 },
  ranger: { dexterity: 1, strength: 1, wisdom: -2 },
  bard: { charisma: 3, wisdom: 2, strength: -2, constitution: -2 },
  paladin: { strength: 3, wisdom: 2, dexterity: -2, charisma: -2, intelligence: -1 },
  warrior: { strength: 3, constitution: 2, intelligence: -4, wisdom: -1 },
  wizard: { intelligence: 4, wisdom: 2, strength: -2, constitution: -2, dexterity: -2 },
  priest: { wisdom: 4, charisma: 1, intelligence: 2, strength: -4, constitution: -2, dexterity: -1 },
};

const raceSkills: Record<Race, Partial<Record<SkillName, number>>> = {
  human: { gather: 1, search: 1, dig: 1, recruit: 1 },
  elf: { search: 2, recruit: 2 },
  dwarf: { mine: 2, dig: 2 },
  gnome: { mine: 1, dig: 1, gather: 2 },
  orc: { mine: 1, dig: 1, gather: 2 },
  troll: { mine: 2, dig: 2 },
  goblin: { search: 1, mine: 1, dig: 1, recruit: 1 },
  kobold: { mine: 1, dig: 1, search: 2 },
  giant: { mine: 4, dig: 4 },
};

const raceModifiers: Record<Race, Partial<StatBlock>> = {
  human: { wisdom: 1, charisma: 1 },
  elf: { intelligence: 1, charisma: 1 },
  dwarf: { strength: 2, constitution: 3, dexterity: -2, intelligence: -1, wisdom: -1, charisma: -1 },
  gnome: { intelligence: 2, wisdom: 1, charisma: 1, strength: -2, constitution: -1, dexterity: -1 },
  orc: { strength: 4, constitution: 1, intelligence: -2, wisdom: -2, charisma: -1 },
  troll: { strength: 2, constitution: 4, dexterity: 1, intelligence: -3, wisdom: -2, charisma: -3 },
  goblin: { dexterity: 4, wisdom: 2, charisma: -3, strength: -1, constitution: -1, intelligence: -1 },
  kobold: { strength: 3, constitution: 1, dexterity: 1, intelligence: -1, wisdom: -1, charisma: -1 },
  giant: { strength: 6, constitution: 7, dexterity: -4, intelligence: -3, wisdom: -3, charisma: -3 },
};

export type Character = {
  name: string;
  x: number;
  y: number;
  inventory: Item[];
  skills: Partial<Record<SkillName, number>>;
  level: number;
  class: CharacterClass;
  race: Race;
  alignment: Alignment;
  experience: number;
  health: number;
  maxHealth: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  alive: boolean;
  recruitAgainAt: number;
};

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function threeD6Plus5() {
  return (
    5 +
    (1 + Math.floor(Math.random() * 6)) +
    (1 + Math.floor(Math.random() * 6)) +
    (1 + Math.floor(Math.random() * 6))
  );
}

function alignmentOf(race: Race): Alignment {
  return lawfulRaces.includes(race) ? "lawful" : "evil";
}

function combineSkills(
  fromClass: Partial<Record<SkillName, number>>,
  fromRace: Partial<Record<SkillName, number>>,
) {
  const skills: Partial<Record<SkillName, number>> = {};
  for (const name of skillNames) {
    const total = (fromClass[name] ?? 0) + (fromRace[name] ?? 0);
    if (total !== 0) skills[name] = total;
  }
  return skills;
}

export function generateCharacter(
  x: number,
  y: number,
  alignment?: Alignment,
  characterClass?: CharacterClass,
  level = 1,
): Character {
  const race = alignment
    ? pick(alignment === "lawful" ? lawfulRaces : evilRaces)
    : pick(races);
  const chosenClass = characterClass ?? pick(classes);
  const stats: StatBlock = {
    strength: threeD6Plus5(),
    dexterity: threeD6Plus5(),
    constitution: threeD6Plus5(),
    intelligence: threeD6Plus5(),
    wisdom: threeD6Plus5(),
    charisma: threeD6Plus5(),
  };
  for (const mods of [raceModifiers[race], classModifiers[chosenClass]]) {
    for (const name of Object.keys(mods) as StatName[]) {
      stats[name] += mods[name] ?? 0;
    }
  }
  for (const name of Object.keys(stats) as StatName[]) {
    if (stats[name] <= 0) stats[name] = 1;
  }
  let maxHealth = 10 + stats.constitution;
  if (maxHealth <= 0) maxHealth = 1;
  if (race === "dwarf" || race === "troll") maxHealth += 2;
  return {
    name: generateCharacterName(),
    x,
    y,
    inventory: [],
    skills: combineSkills(classSkills[chosenClass], raceSkills[race]),
    level,
    class: chosenClass,
    race,
    alignment: alignment ?? alignmentOf(race),
    experience: 0,
    health: maxHealth,
    maxHealth,
    ...stats,
    alive: true,
    recruitAgainAt: 0,
  };
}

export function addCharacter(party: Character[], character: Character) {
  if (party.length >= maxPartySize) return false;
  party.push(character);
  return true;
}

export function partyAlive(party: Character[]) {
  return party.some((character) => character.alive);
}

// 5% at recruit 0, 95% at recruit 20. A matching alignment adds 5%.
export function recruitChance(recruiter: Character, placeEvil: boolean) {
  const rank = Math.min(20, Math.max(0, recruiter.skills.recruit ?? 0));
  const fromSkill = 5 + rank * 4.5;
  const matches = (recruiter.alignment === "evil") === placeEvil;
  return Math.min(100, fromSkill + (matches ? 5 : 0));
}

export type RecruitKind =
  | "village"
  | "castle"
  | "floatingCastle"
  | "temple"
  | "shrine"
  | "wizardTower";

export type RecruitSite = {
  evil: boolean;
  level?: number;
  recruited?: boolean;
  recruitFailures?: number;
};

function classesHere(kind: RecruitKind, level: number) {
  const found: CharacterClass[] = [];
  if ((kind === "village" || kind === "castle") && level < 3)
    found.push("warrior");
  if ((kind === "temple" && level > 4) || (kind === "castle" && level > 5))
    found.push("priest");
  if ((kind === "castle" || kind === "wizardTower") && level < 6)
    found.push("mage");
  if ((kind === "temple" || kind === "shrine") && level > 2)
    found.push("cleric");
  if ((kind === "village" && level >= 3 && level <= 5) || kind === "castle")
    found.push("thief");
  if (kind === "village" && (level === 2 || level === 3)) found.push("ranger");
  if ((kind === "village" || kind === "castle") && (level === 4 || level === 5))
    found.push("bard");
  if (kind === "castle" && level > 5) found.push("paladin");
  if (kind === "wizardTower" && level > 4) found.push("wizard");
  return found;
}

export function tryRecruit(
  party: Character[],
  recruiter: Character,
  site: RecruitSite | null,
  kind: RecruitKind | null,
  now = Date.now(),
) {
  if (!recruiter.skills.recruit)
    return "this character does not have the recruit skill";
  if (!site || !kind) return "You cannot recruit here.";
  if (kind === "floatingCastle") {
    if (site.recruited)
      return "there is no one else here that will join your cause!";
    if (recruiter.recruitAgainAt > now) return "You cannot recruit again yet.";
    if (party.length >= maxPartySize) return "The party is full.";
    site.recruited = true;
    const alignment: Alignment = site.evil ? "evil" : "lawful";
    const joined = generateCharacter(
      recruiter.x,
      recruiter.y,
      alignment,
      pick(classes),
      10,
    );
    addCharacter(party, joined);
    return `A ${joined.alignment} ${joined.race} ${joined.class} joins you.`;
  }
  const choices = classesHere(kind, site.level ?? 1);
  if (choices.length === 0)
    return "alas, there is none here that can answer your call to adventure";
  if (site.recruited)
    return "there is no one else here that will join your cause!";
  if ((site.recruitFailures ?? 0) >= 10)
    return "this location has no one willing to join you!";
  if (recruiter.recruitAgainAt > now) return "You cannot recruit again yet.";
  if (party.length >= maxPartySize) return "The party is full.";
  const chance = recruitChance(recruiter, site.evil);
  if (Math.random() * 100 >= chance) {
    site.recruitFailures = (site.recruitFailures ?? 0) + 1;
    recruiter.recruitAgainAt = now + recruitCooldownMs;
    return "No one joins you.";
  }
  site.recruited = true;
  const alignment: Alignment = site.evil ? "evil" : "lawful";
  const joined = generateCharacter(
    recruiter.x,
    recruiter.y,
    alignment,
    pick(choices),
  );
  addCharacter(party, joined);
  return `A ${joined.alignment} ${joined.race} ${joined.class} joins you.`;
}

function castleTiles(world: Uint8Array) {
  const spots: { x: number; y: number }[] = [];
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      if (world[y * worldWidth + x] !== castle) continue;
      spots.push({ x, y });
    }
  }
  return spots;
}

function nearestWalkable(world: Uint8Array, origin: { x: number; y: number }) {
  const probe = { inventory: [] as Character["inventory"] };
  for (let radius = 0; radius <= 3; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const x = origin.x + dx;
        const y = origin.y + dy;
        if (canOccupy(probe, world, x, y)) return { x, y };
      }
    }
  }
  return { x: origin.x, y: origin.y };
}

export function startNearCastle(world: Uint8Array) {
  const keeps = castleTiles(world);
  const origin = keeps[0] ?? {
    x: Math.floor(worldWidth / 2),
    y: Math.floor(worldHeight / 2),
  };
  return nearestWalkable(world, origin);
}

export function createParty(world: Uint8Array) {
  const spot = startNearCastle(world);
  const party: Character[] = [];
  const character = generateCharacter(spot.x, spot.y);
  character.inventory.push(generateItem(character.level));
  addCharacter(party, character);
  return party;
}

export function clampPlayer(player: Character) {
  player.x = Math.min(worldWidth - 1, Math.max(0, player.x));
  player.y = Math.min(worldHeight - 1, Math.max(0, player.y));
}

export function canOccupy(
  player: { inventory: Item[] },
  world: Uint8Array,
  x: number,
  y: number,
) {
  if (x < 0 || y < 0 || x >= worldWidth || y >= worldHeight) return false;
  const requirement = biomes[world[y * worldWidth + x]].requirementToPass;
  if (requirement === "none") return true;
  if (requirement === "impassable") return false;
  return false;
}

const glyphCache = new Map<string, HTMLCanvasElement>();

export function characterGlyph(
  tileSize: number,
  character: Pick<Character, "class" | "alignment">,
) {
  const key = `${tileSize}:${character.class}:${character.alignment}`;
  const cached = glyphCache.get(key);
  if (cached) return cached;
  const mark = classMarks[character.class];
  const fontSize = tileSize * 1.38;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(fontSize + 4);
  canvas.height = Math.ceil(fontSize + 4);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const lawful = character.alignment === "lawful";
  ctx.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2;
  ctx.strokeStyle = lawful ? mark.lawfulEdge : mark.evilEdge;
  ctx.strokeText(mark.glyph, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = lawful ? mark.lawful : mark.evil;
  ctx.fillText(mark.glyph, canvas.width / 2, canvas.height / 2);
  glyphCache.set(key, canvas);
  return canvas;
}
