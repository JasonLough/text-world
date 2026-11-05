export const itemTypes = [
  "weapon",
  "item",
  "armor",
  "ring",
  "amulet",
  "artifact",
  "book",
  "scroll",
] as const;

export const rarities = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const;

export const itemProperties = [
  "none",
  "magic",
  "cursed",
  "blessed",
  "legendary",
] as const;

export const itemEffects = [
  "damage",
  "healing",
  "buff",
  "debuff",
  "status",
  "utility",
] as const;

export const attributes = [
  "strength",
  "dexterity",
  "intelligence",
  "wisdom",
  "charisma",
  "constitution",
] as const;

export type ItemType = (typeof itemTypes)[number];
export type Rarity = (typeof rarities)[number];
export type ItemProperty = (typeof itemProperties)[number];
export type ItemEffect = (typeof itemEffects)[number];
export type Attribute = (typeof attributes)[number];

export type ItemRequirement = {
  attribute: Attribute;
  amount: number;
};

export type Item = {
  name: string;
  description: string;
  level: number;
  type: ItemType;
  rarity: Rarity;
  value: number;
  properties: ItemProperty[];
  effects: ItemEffect[];
  requirements: ItemRequirement[];
  bonuses: Attribute[];
  penalties: Attribute[];
  potency: number;
};

const rarityWeight: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 16,
};

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickCount<T>(list: readonly T[], count: number) {
  const pool = [...list];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function pickWeighted<T>(entries: { value: T; weight: number }[]) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll < 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

function rollLevel(characterLevel: number) {
  const min = Math.max(1, characterLevel - 3);
  const max = Math.max(min, characterLevel + Math.floor(Math.random() * 3));
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function itemDetailLines(item: Item) {
  return [
    `level ${item.level}`,
    item.rarity,
    item.properties[0],
    item.effects[0],
    ...item.requirements.map(
      (requirement) =>
        `requires ${requirement.attribute} ${requirement.amount}`,
    ),
    item.bonuses.length > 0 ? `bonuses ${item.bonuses.join(", ")}` : "",
    item.penalties.length > 0 ? `penalties ${item.penalties.join(", ")}` : "",
    `potency ${item.potency}`,
    `value ${item.value}`,
  ].filter((line) => line !== "");
}

export function generateItem(characterLevel: number): Item {
  const type = pick(itemTypes);
  const rarity = pickWeighted([
    { value: "common" as const, weight: 50 },
    { value: "uncommon" as const, weight: 30 },
    { value: "rare" as const, weight: 15 },
    { value: "epic" as const, weight: 4 },
    { value: "legendary" as const, weight: 1 },
  ]);
  const property = pickWeighted([
    { value: "none" as const, weight: 50 },
    { value: "magic" as const, weight: 30 },
    { value: "cursed" as const, weight: 15 },
    { value: "blessed" as const, weight: 4 },
    { value: "legendary" as const, weight: 1 },
  ]);
  const effect = pick(itemEffects);
  let level = rollLevel(characterLevel);
  let potency = 1;
  let bonuses: Attribute[] = [];
  let penalties: Attribute[] = [];
  if (property === "cursed") {
    level = Math.max(1, level - 4);
    potency = 1.2;
    penalties = pickCount(attributes, 2 + Math.floor(Math.random() * 2));
  }
  if (property === "blessed") {
    level = Math.min(101, level + 1);
    potency = 1.1;
    bonuses = pickCount(attributes, 1 + Math.floor(Math.random() * 3));
  }
  const requirements = pickCount(
    attributes,
    Math.floor(Math.random() * 4),
  ).map((attribute) => ({ attribute, amount: 10 + level }));
  let value = rarityWeight[rarity] * level * Math.random() * 50 + 5;
  if (property === "cursed") value *= 0.95;
  if (property === "blessed") value *= 1.1;
  const item: Item = {
    name:
      property === "cursed" || property === "blessed"
        ? `${property} ${type}`
        : `${effect} ${type}`,
    description: "",
    level,
    type,
    rarity,
    value: Math.floor(value),
    properties: [property],
    effects: [effect],
    requirements,
    bonuses,
    penalties,
    potency,
  };
  if (property === "cursed" || property === "blessed")
    item.description = itemDetailLines(item).join("\n");
  return item;
}
