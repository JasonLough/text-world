export const deepWater = 0;
export const water = 1;
export const ice = 2;
export const river = 3;
export const beach = 4;
export const desert = 5;
export const grass = 6;
export const forest = 7;
export const tropical = 8;
export const swamp = 9;
export const highMountain = 10;
export const mountain = 11;
export const snow = 12;
export const space = 13;
export const shallows = 14;
export const scrubHills = 15;
export const snowForest = 16;
export const savanna = 17;
export const badlands = 18;
export const mangrove = 19;
export const village = 20;
export const castle = 21;
export const floatingCastle = 22;
export const graveyard = 23;
export const temple = 24;
export const cave = 25;
export const ruins = 26;
export const road = 27;
export const farmland = 28;
export const poisonedGround = 29;
export const thornyBrush = 30;
export const lava = 31;
export const wizardTower = 32;
export const volcano = 33;
export const grassyHills = 34;
export const shrine = 35;

export type Biome = {
  symbols: string[];
  color: string;
  name: string;
  type: string;
  requirementToPass:
    | "none"
    | "shallow water"
    | "deep water"
    | "flight"
    | "thorn protection"
    | "lava protection"
    | "poison protection"
    | "cold protection"
    | "hot protection"
    | "illumination"
    | "climbing gear"
    | "impassable"
    | "cold weather gear"
    | "hot weather gear"
    | "illumination";
  speedMultiplier: "verySlow" | "slow" | "none" | "fast" | "veryFast";
  monsterEncounterPossible: boolean;
};

export const biomes: Biome[] = [
  {
    symbols: ["≈", "≡"],
    color: "#1c6eae",
    name: "Deep water",
    type: "ocean",
    requirementToPass: "deep water",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["~", "-"],
    color: "#49b0ea",
    name: "Water",
    type: "water",
    requirementToPass: "shallow water",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["+", "·", "#", "="],
    color: "#ffffff",
    name: "Ice",
    type: "ice",
    requirementToPass: "cold protection",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["≈", "~"],
    color: "#4eb6f0",
    name: "River",
    type: "river",
    requirementToPass: "shallow water",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: [".", ":"],
    color: "#f6e7b2",
    name: "Beach",
    type: "beach",
    requirementToPass: "none",
    speedMultiplier: "fast",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["~", ".", ":"],
    color: "#ffe8b0",
    name: "Desert",
    type: "desert",
    requirementToPass: "hot protection",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: [".", ",", '"', "'"],
    color: "#b6ee74",
    name: "Grass",
    type: "grassland",
    requirementToPass: "none",
    speedMultiplier: "veryFast",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["♠", "T", "↑"],
    color: "#67c85a",
    name: "Forest",
    type: "arboreal forest",
    requirementToPass: "none",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["♣", "&", "¶"],
    color: "#7dffa8",
    name: "Tropical forest",
    type: "tropical forest",
    requirementToPass: "none",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ['"', "~", ","],
    color: "#d2dd8a",
    name: "Swamp",
    type: "swamp",
    requirementToPass: "none",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["A"],
    color: "#6f7c89",
    name: "High Mountain",
    type: "high mountain",
    requirementToPass: "flight",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["^", "▲"],
    color: "#7c8996",
    name: "Mountain",
    type: "mountain",
    requirementToPass: "climbing gear",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["*", "+", "^"],
    color: "#ffffff",
    name: "Snow",
    type: "tundra",
    requirementToPass: "cold protection",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: [" "],
    color: "#000000",
    name: "Empty space",
    type: "empty space",
    requirementToPass: "flight",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["~", "-", "."],
    color: "#8ed0f2",
    name: "Shallows",
    type: "shallows",
    requirementToPass: "shallow water",
    speedMultiplier: "slow",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["^", "n", "∩"],
    color: "#b7b49a",
    name: "Scrub brush hills",
    type: "scrub brush hills",
    requirementToPass: "none",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["♠", "T", "↑"],
    color: "#ffffff",
    name: "Snow Forest",
    type: "snow forest",
    requirementToPass: "cold protection",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ['"', "'", ";"],
    color: "#d4d06a",
    name: "Savanna",
    type: "savanna",
    requirementToPass: "none",
    speedMultiplier: "fast",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["%", "#", ":"],
    color: "#c47848",
    name: "Badlands",
    type: "badlands",
    requirementToPass: "hot protection",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["&", '"', "~"],
    color: "#5f7d3a",
    name: "Mangrove",
    type: "mangrove",
    requirementToPass: "shallow water",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["⌂"],
    color: "#f2c14e",
    name: "Village",
    type: "village",
    requirementToPass: "none",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["♜"],
    color: "#d9dde6",
    name: "Castle",
    type: "castle",
    requirementToPass: "none",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["♔"],
    color: "#d9dde6",
    name: "Floating castle",
    type: "floating castle",
    requirementToPass: "flight",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["†"],
    color: "#d9dde6",
    name: "Graveyard",
    type: "graveyard",
    requirementToPass: "none",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["Ω"],
    color: "#d9dde6",
    name: "Temple",
    type: "temple",
    requirementToPass: "none",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["∩"],
    color: "#a67c52",
    name: "Cave",
    type: "cave",
    requirementToPass: "illumination",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["x"],
    color: "#d7b899",
    name: "Ruins",
    type: "ruins",
    requirementToPass: "illumination",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["─"],
    color: "#c9a04a",
    name: "Road",
    type: "road",
    requirementToPass: "none",
    speedMultiplier: "veryFast",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["▤"],
    color: "#5cad3a",
    name: "Farmland",
    type: "farmland",
    requirementToPass: "none",
    speedMultiplier: "veryFast",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["§", "‡", "¤"],
    color: "#c46bff",
    name: "Poisoned ground",
    type: "poisoned ground",
    requirementToPass: "poison protection",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["¥", "#"],
    color: "#7a8f32",
    name: "Thorny brush",
    type: "thorny brush",
    requirementToPass: "thorn protection",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["≈", "~"],
    color: "#ff4d1a",
    name: "Lava",
    type: "lava",
    requirementToPass: "lava protection",
    speedMultiplier: "verySlow",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["Ψ"],
    color: "#d9dde6",
    name: "Wizard tower",
    type: "wizard tower",
    requirementToPass: "none",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["▲"],
    color: "#ffd24a",
    name: "Volcano",
    type: "volcano",
    requirementToPass: "impassable",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
  {
    symbols: ["^", "n", "∩"],
    color: "#b6ee74",
    name: "Grassy hills",
    type: "grassy hills",
    requirementToPass: "none",
    speedMultiplier: "slow",
    monsterEncounterPossible: true,
  },
  {
    symbols: ["✝"],
    color: "#d9dde6",
    name: "Shrine",
    type: "shrine",
    requirementToPass: "none",
    speedMultiplier: "none",
    monsterEncounterPossible: false,
  },
];

export const biomeRgb: [number, number, number][] = biomes.map((biome) => {
  const value = Number.parseInt(biome.color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
});
