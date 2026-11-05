const resources = [
  "gold",
  "wood",
  "artifacts",
  "iron",
  "food",
  "cloth",
  "weapons",
  "ore",
  "herbs",
  "horses",
] as const;

const utilities = [
  "forge",
  "lumber mill",
  "item shop",
  "magic shop",
  "weapon shop",
  "armor shop",
  "bank",
  "inn",
  "tavern",
  "magic forge",
] as const;

type Resource = (typeof resources)[number];
type Utility = (typeof utilities)[number];
type Range =
  | "none"
  | "very low"
  | "low"
  | "some"
  | "high"
  | "very high"
  | "legendary";

const levels: {
  wealth: Range;
  defenses: Range;
  population: 0 | Range;
  resources: Resource[];
  extraResources: number;
  bannedResources: Resource[];
  utility: Utility[];
  extraUtility: number;
  allowMagicForge: boolean;
}[] = [
  {
    wealth: "none",
    defenses: "none",
    population: "very low",
    resources: [],
    extraResources: 0,
    bannedResources: [],
    utility: [],
    extraUtility: 0,
    allowMagicForge: false,
  },
  {
    wealth: "very low",
    defenses: "very low",
    population: "very low",
    resources: ["food"],
    extraResources: 0,
    bannedResources: [],
    utility: ["inn"],
    extraUtility: 0,
    allowMagicForge: false,
  },
  {
    wealth: "low",
    defenses: "low",
    population: "low",
    resources: ["herbs", "food", "wood"],
    extraResources: 0,
    bannedResources: [],
    utility: ["inn", "item shop"],
    extraUtility: 0,
    allowMagicForge: false,
  },
  {
    wealth: "low",
    defenses: "some",
    population: "some",
    resources: ["herbs", "food", "wood"],
    extraResources: 1,
    bannedResources: ["artifacts", "gold", "horses"],
    utility: ["inn", "item shop"],
    extraUtility: 1,
    allowMagicForge: false,
  },
  {
    wealth: "some",
    defenses: "high",
    population: "some",
    resources: ["herbs", "food", "wood"],
    extraResources: 2,
    bannedResources: ["artifacts", "gold"],
    utility: ["inn", "item shop", "tavern"],
    extraUtility: 1,
    allowMagicForge: false,
  },
  {
    wealth: "some",
    defenses: "high",
    population: "some",
    resources: ["herbs", "food", "wood"],
    extraResources: 3,
    bannedResources: ["artifacts"],
    utility: ["inn", "item shop", "tavern"],
    extraUtility: 2,
    allowMagicForge: false,
  },
  {
    wealth: "some",
    defenses: "high",
    population: "high",
    resources: ["herbs", "food", "wood"],
    extraResources: 4,
    bannedResources: ["artifacts"],
    utility: ["inn", "item shop", "tavern"],
    extraUtility: 3,
    allowMagicForge: false,
  },
  {
    wealth: "high",
    defenses: "very high",
    population: "high",
    resources: ["herbs", "food", "wood", "artifacts"],
    extraResources: 5,
    bannedResources: ["artifacts"],
    utility: ["inn"],
    extraUtility: 2,
    allowMagicForge: false,
  },
  {
    wealth: "very high",
    defenses: "legendary",
    population: "very high",
    resources: ["artifacts"],
    extraResources: 5,
    bannedResources: [],
    utility: ["inn"],
    extraUtility: 3,
    allowMagicForge: true,
  },
  {
    wealth: "legendary",
    defenses: "legendary",
    population: "legendary",
    resources: ["artifacts"],
    extraResources: 8,
    bannedResources: [],
    utility: ["inn"],
    extraUtility: 7,
    allowMagicForge: true,
  },
];

function randomFromSeed(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(name: string, evil: boolean) {
  let n = evil ? 1 : 2;
  for (let i = 0; i < name.length; i++) {
    n = Math.imul(n ^ name.charCodeAt(i), 1274126177);
  }
  return n >>> 0;
}

function take<T>(random: () => number, items: readonly T[], count: number) {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export function castleProfile(name: string, evil: boolean, maxLevel = 10) {
  const random = randomFromSeed(seedFor(name, evil));
  const level = 1 + Math.floor(random() * maxLevel);
  const row = levels[level - 1];
  const rulers = evil
    ? (["goblin", "troll", "ogre"] as const)
    : (["elf", "dwarf", "human"] as const);
  const ruler = rulers[Math.floor(random() * rulers.length)];
  const baseResource =
    row.resources.length === 0
      ? []
      : [row.resources[Math.floor(random() * row.resources.length)]];
  const resourcesHeld = [
    ...baseResource,
    ...take(
      random,
      resources.filter(
        (item) =>
          !baseResource.includes(item) && !row.bannedResources.includes(item),
      ),
      row.extraResources,
    ),
  ];
  const utilityHeld = [
    ...row.utility,
    ...take(
      random,
      utilities.filter(
        (item) =>
          !row.utility.includes(item) &&
          (row.allowMagicForge || item !== "magic forge"),
      ),
      row.extraUtility,
    ),
  ];
  return {
    ruler,
    level,
    wealth: row.wealth,
    defenses: row.defenses,
    population: row.population,
    resources: resourcesHeld,
    utility: utilityHeld,
  };
}

export function wizardTowerProfile(x: number, y: number, evil: boolean) {
  const random = randomFromSeed(seedFor(`${x},${y}`, evil));
  const level = 1 + Math.floor(random() * 10);
  const row = levels[level - 1];
  const rulers = evil
    ? (["goblin", "troll", "ogre"] as const)
    : (["elf", "dwarf", "human"] as const);
  const ruler = rulers[Math.floor(random() * rulers.length)];
  const treasure = random() < 0.5 ? "gold" : "artifact";
  return {
    ruler,
    level,
    wealth: row.wealth,
    defenses: row.defenses,
    treasure,
  };
}
