import {
  badlands,
  beach,
  biomes,
  castle,
  cave,
  deepWater,
  desert,
  farmland,
  floatingCastle,
  forest,
  grass,
  grassyHills,
  graveyard,
  highMountain,
  ice,
  lava,
  mangrove,
  mountain,
  poisonedGround,
  river,
  road,
  ruins,
  savanna,
  scrubHills,
  shallows,
  snow,
  space,
  snowForest,
  swamp,
  shrine,
  temple,
  thornyBrush,
  tropical,
  village,
  volcano,
  water,
  wizardTower,
} from "./tiles";
import { castleProfile, wizardTowerProfile } from "./castle";
import castleNames from "./castleNames.json";
import townNames from "./townNames.json";
import templeNames from "./templeNames.json";
import caveNames from "./caveNames.json";
import shrineNames from "./shrineNames.json";

export type AlignedPlace = {
  x: number;
  y: number;
  evil: boolean;
};

export type NamedPlace = AlignedPlace & {
  name: string;
};

export type Castle = NamedPlace & ReturnType<typeof castleProfile>;

export type Village = Castle;

export type WizardTower = AlignedPlace & ReturnType<typeof wizardTowerProfile>;

export const worldWidth = 2048;
export const worldHeight = 1536;
export const worldSeed = Math.floor(Math.random() * 9999);

export function hash(x: number, y: number) {
  let n =
    Math.imul(x | 0, 374761393) +
    Math.imul(y | 0, 668265263) +
    Math.imul(worldSeed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

function randomFromSeed(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fade(t: number) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const v00 = hash(x0, y0) / 4294967296;
  const v10 = hash(x0 + 1, y0) / 4294967296;
  const v01 = hash(x0, y0 + 1) / 4294967296;
  const v11 = hash(x0 + 1, y0 + 1) / 4294967296;
  const top = v00 + (v10 - v00) * tx;
  const bottom = v01 + (v11 - v01) * tx;
  return top + (bottom - top) * ty;
}

function field(
  x: number,
  y: number,
  seedX: number,
  seedY: number,
  broadScale = 36,
  detailScale = 12,
) {
  const sx = x + seedX;
  const sy = y + seedY;
  const broad = valueNoise(sx / broadScale, sy / broadScale);
  const detail = valueNoise(sx / detailScale, sy / detailScale);
  return broad * 0.72 + detail * 0.28;
}

function isWater(biome: number) {
  return biome === deepWater || biome === water || biome === ice;
}

function touchesShore(biome: number) {
  return isWater(biome) || biome === shallows;
}

function isEmptySpace(x: number, y: number) {
  const cell = 360;
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  if (hash(cx + 8100, cy + 2700) / 4294967296 > 0.5) return false;

  const centerX = (cx + 0.5) * cell;
  const centerY = (cy + 0.5) * cell;
  const width = 100 + (hash(cx + 29, cy + 41) / 4294967296) * 200;
  const height = 100 + (hash(cx + 13, cy + 53) / 4294967296) * 200;
  const dx = (x + 0.5 - centerX) / (width / 2);
  const dy = (y + 0.5 - centerY) / (height / 2);
  const edge = valueNoise((x + 9100) / 36, (y + 3600) / 36);
  return dx * dx + dy * dy <= 1 + (edge - 0.5) * 0.12;
}

export function generateWorld() {
  const random = randomFromSeed(worldSeed);
  const elevation = new Uint8Array(worldWidth * worldHeight);
  const moisture = new Uint8Array(worldWidth * worldHeight);
  const biome = new Uint8Array(worldWidth * worldHeight);

  for (let y = 0; y < worldHeight; y++) {
    const latitude = Math.abs((y / (worldHeight - 1)) * 2 - 1);
    for (let x = 0; x < worldWidth; x++) {
      const index = y * worldWidth + x;
      let height = field(x, y, 0, 0);
      const wetness = field(x, y, 4200, 1800);
      const distance = Math.hypot(x / worldWidth - 0.5, y / worldHeight - 0.5);
      if (distance > 0.46) height -= (distance - 0.46) * 0.85;

      const climate = field(x, y, 2500, 900);
      const temperature =
        1 -
        latitude -
        Math.max(0, height - 0.55) * 0.45 +
        (climate - 0.5) * 0.55;
      elevation[index] = Math.max(0, Math.min(255, height * 255));
      moisture[index] = Math.max(0, Math.min(255, wetness * 255));

      if (height < 0.28) {
        biome[index] = temperature < 0.16 ? ice : deepWater;
      } else if (height < 0.32) {
        biome[index] = temperature < 0.16 ? ice : water;
      } else if (height < 0.36) {
        biome[index] = temperature < 0.16 ? ice : shallows;
      } else if (height > 0.86) {
        biome[index] = temperature < 0.3 ? snow : highMountain;
      } else if (height > 0.78) {
        biome[index] = temperature < 0.3 ? snow : mountain;
      } else if (height > 0.68) {
        biome[index] =
          temperature < 0.3 ? snow : wetness > 0.5 ? grassyHills : scrubHills;
      } else if (temperature < 0.16) {
        biome[index] = snow;
      } else if (isEmptySpace(x, y)) {
        biome[index] = space;
      } else if (height > 0.58 && wetness < 0.4) {
        biome[index] = badlands;
      } else if (wetness > 0.64 && height < 0.5 && temperature > 0.62) {
        biome[index] = mangrove;
      } else if (wetness > 0.64 && height < 0.5) {
        biome[index] = swamp;
      } else if (wetness < 0.34 && temperature > 0.55) {
        biome[index] = desert;
      } else if (wetness < 0.46 && temperature > 0.5) {
        biome[index] = savanna;
      } else if (wetness > 0.68 && temperature > 0.62) {
        biome[index] = tropical;
      } else if (temperature < 0.32 && wetness > 0.45) {
        biome[index] = snowForest;
      } else if (wetness > 0.5) {
        biome[index] = forest;
      } else {
        biome[index] = grass;
      }
    }
  }

  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      const index = y * worldWidth + x;
      const kind = biome[index];
      if (
        isWater(kind) ||
        kind === shallows ||
        kind === highMountain ||
        kind === mountain ||
        kind === snow ||
        kind === space
      )
        continue;
      if (elevation[index] > 130 || moisture[index] > 130) continue;

      const shore =
        (x > 0 && touchesShore(biome[index - 1])) ||
        (x < worldWidth - 1 && touchesShore(biome[index + 1])) ||
        (y > 0 && touchesShore(biome[index - worldWidth])) ||
        (y < worldHeight - 1 && touchesShore(biome[index + worldWidth]));
      if (shore) biome[index] = beach;
    }
  }

  let rivers = 0;
  let tries = 0;
  while (rivers < 140 && tries < 4000) {
    tries += 1;
    const x = Math.floor(random() * worldWidth);
    const y = Math.floor(random() * worldHeight);
    if (elevation[y * worldWidth + x] < 188) continue;
    carveRiver(x, y, elevation, biome);
    rivers += 1;
  }

  cutSpace(biome);
  const {
    castles,
    towns,
    temples,
    shrines,
    caves,
    floatingCastles,
    graveyards,
    wizardTowers,
  } = placeSpecials(biome, random);
  paintUncommon(biome);
  placeVolcanoes(biome, random);
  return {
    biome,
    castles,
    towns,
    temples,
    shrines,
    caves,
    floatingCastles,
    graveyards,
    wizardTowers,
  };
}

function placeSpecials(biome: Uint8Array, random: () => number) {
  const placed: { x: number; y: number }[] = [];
  const castles: Castle[] = [];
  const usedNames = new Set<string>();
  const villages: Village[] = [];
  const temples: Castle[] = [];
  const shrines: Castle[] = [];
  const caves: NamedPlace[] = [];
  const floatingCastles: AlignedPlace[] = [];
  const graveyards: AlignedPlace[] = [];
  const wizardTowers: WizardTower[] = [];
  const gap = 8;

  const inWater = (kind: number) =>
    kind === deepWater || kind === water || kind === shallows || kind === river;

  const isSpecial = (kind: number) =>
    kind === village ||
    kind === castle ||
    kind === floatingCastle ||
    kind === graveyard ||
    kind === temple ||
    kind === shrine ||
    kind === cave ||
    kind === ruins ||
    kind === farmland ||
    kind === wizardTower;

  const openGround = (kind: number) =>
    !inWater(kind) &&
    kind !== space &&
    !isSpecial(kind) &&
    biomes[kind].requirementToPass === "none";

  const separated = (x: number, y: number) => {
    for (const spot of placed) {
      const dx = spot.x - x;
      const dy = spot.y - y;
      if (dx * dx + dy * dy < gap * gap) return false;
    }
    return true;
  };

  const riverNearby = (x: number, y: number) => {
    const radius = 50;
    for (let dy = -radius; dy <= radius; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= worldHeight) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const nx = x + dx;
        if (nx < 0 || nx >= worldWidth) continue;
        if (biome[ny * worldWidth + nx] === river) return true;
      }
    }
    return false;
  };

  const nearSpot = (
    spots: { x: number; y: number }[],
    x: number,
    y: number,
    radius: number,
  ) => {
    const reach = radius * radius;
    for (const spot of spots) {
      const dx = spot.x - x;
      const dy = spot.y - y;
      if (dx * dx + dy * dy <= reach) return true;
    }
    return false;
  };

  const roll = (min: number, max: number) =>
    min + Math.floor(random() * (max - min + 1));

  const scatter = (
    kind: number,
    count: number,
    accept: (x: number, y: number, ground: number) => boolean,
  ) => {
    let found = 0;
    let attempts = 0;
    while (found < count && attempts < 30000) {
      attempts += 1;
      const x = Math.floor(random() * worldWidth);
      const y = Math.floor(random() * worldHeight);
      if (!separated(x, y)) continue;
      const ground = biome[y * worldWidth + x];
      if (!accept(x, y, ground)) continue;
      biome[y * worldWidth + x] = kind;
      const spot = { x, y };
      placed.push(spot);
      if (kind === castle) {
        const named = namePlace(random, usedNames, castleNames);
        castles.push({
          ...spot,
          ...named,
          ...castleProfile(named.name, named.evil),
        });
      }
      if (kind === village) {
        const named = namePlace(random, usedNames, townNames);
        villages.push({
          ...spot,
          ...named,
          ...castleProfile(named.name, named.evil, 5),
        });
      }
      if (kind === temple) {
        const named = namePlace(random, usedNames, templeNames, "lawful");
        temples.push({
          ...spot,
          ...named,
          ...castleProfile(named.name, named.evil),
        });
      }
      if (kind === shrine) {
        const named = namePlace(random, usedNames, shrineNames);
        shrines.push({
          ...spot,
          ...named,
          ...castleProfile(named.name, named.evil),
        });
      }
      if (kind === cave)
        caves.push({
          ...spot,
          ...namePlace(random, usedNames, caveNames, "evil"),
        });
      if (kind === graveyard)
        graveyards.push({ ...spot, evil: random() < 0.25 });
      if (kind === floatingCastle)
        floatingCastles.push({ ...spot, evil: random() < 0.25 });
      if (kind === wizardTower) {
        const evil = random() < 0.25;
        wizardTowers.push({
          ...spot,
          evil,
          ...wizardTowerProfile(spot.x, spot.y, evil),
        });
      }
      found += 1;
    }
  };

  scatter(temple, 3, (_x, _y, ground) => openGround(ground));
  scatter(shrine, 3, (_x, _y, ground) => openGround(ground));
  scatter(castle, 5, (x, y, ground) => openGround(ground) && riverNearby(x, y));
  scatter(
    village,
    roll(10, 20),
    (x, y, ground) => openGround(ground) && nearSpot(castles, x, y, 100),
  );
  scatter(
    graveyard,
    roll(5, 15),
    (x, y, ground) => openGround(ground) && nearSpot(temples, x, y, 200),
  );

  const caveCount = roll(35, 45);
  const favored = Math.round(caveCount * 0.75);
  scatter(
    cave,
    favored,
    (_x, _y, ground) =>
      ground === grassyHills ||
      ground === scrubHills ||
      ground === mountain ||
      ground === highMountain,
  );
  scatter(
    cave,
    caveCount - favored,
    (_x, _y, ground) => ground === ice || ground === grass || ground === forest,
  );

  scatter(ruins, roll(10, 15), (_x, _y, ground) => openGround(ground));
  scatter(wizardTower, roll(10, 15), (_x, _y, ground) => openGround(ground));
  scatter(floatingCastle, 1, (_x, _y, ground) => {
    if (isSpecial(ground)) return false;
    return inWater(ground) || ground === space || openGround(ground);
  });

  for (const hamlet of villages) {
    for (const keep of castles) {
      const dx = hamlet.x - keep.x;
      const dy = hamlet.y - keep.y;
      if (dx * dx + dy * dy > 50 * 50) continue;
      layRoad(biome, keep, hamlet, isSpecial);
    }
  }

  for (const hamlet of villages) {
    const count = 1 + Math.floor(random() * 7);
    const spots: { x: number; y: number }[] = [];
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (dx === 0 && dy === 0) continue;
        spots.push({ x: hamlet.x + dx, y: hamlet.y + dy });
      }
    }
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const swap = spots[i];
      spots[i] = spots[j];
      spots[j] = swap;
    }
    let found = 0;
    for (const spot of spots) {
      if (found >= count) break;
      if (
        spot.x < 0 ||
        spot.y < 0 ||
        spot.x >= worldWidth ||
        spot.y >= worldHeight
      )
        continue;
      const ground = biome[spot.y * worldWidth + spot.x];
      if (ground === road || !openGround(ground)) continue;
      biome[spot.y * worldWidth + spot.x] = farmland;
      found += 1;
    }
  }

  return {
    castles,
    towns: villages,
    temples,
    shrines,
    caves,
    floatingCastles,
    graveyards,
    wizardTowers,
  };
}

function paintUncommon(biome: Uint8Array) {
  const cell = 110;
  const hosts: Record<number, number[]> = {
    [poisonedGround]: [grass, forest, swamp, mangrove, snowForest, tropical],
    [thornyBrush]: [grass, savanna, desert, grassyHills, scrubHills, badlands],
    [lava]: [grassyHills, scrubHills, badlands, mountain, highMountain, desert],
  };
  const cols = Math.ceil(worldWidth / cell);
  const rows = Math.ceil(worldHeight / cell);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (hash(cx + 5100, cy + 8800) / 4294967296 > 0.28) continue;
      const centerX = (cx + 0.35 + (hash(cx + 4, cy) / 4294967296) * 0.3) * cell;
      const centerY =
        (cy + 0.35 + (hash(cx, cy + 4) / 4294967296) * 0.3) * cell;
      const gx = Math.min(worldWidth - 1, Math.max(0, Math.floor(centerX)));
      const gy = Math.min(worldHeight - 1, Math.max(0, Math.floor(centerY)));
      const ground = biome[gy * worldWidth + gx];
      const choices = [poisonedGround, thornyBrush, lava].filter((kind) =>
        hosts[kind].includes(ground),
      );
      if (choices.length === 0) continue;
      const kind = choices[hash(cx + 17, cy + 91) % choices.length];
      const allowed = hosts[kind];
      const width = 8 + (hash(cx + 3, cy + 7) / 4294967296) * 12;
      const height = 8 + (hash(cx + 11, cy + 19) / 4294967296) * 12;
      const x0 = Math.max(0, Math.floor(centerX - width / 2));
      const x1 = Math.min(worldWidth - 1, Math.ceil(centerX + width / 2));
      const y0 = Math.max(0, Math.floor(centerY - height / 2));
      const y1 = Math.min(worldHeight - 1, Math.ceil(centerY + height / 2));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = (x + 0.5 - centerX) / (width / 2);
          const dy = (y + 0.5 - centerY) / (height / 2);
          const edge = valueNoise((x + 1400) / 18, (y + 2600) / 18);
          if (dx * dx + dy * dy > 1 + (edge - 0.5) * 0.35) continue;
          const index = y * worldWidth + x;
          if (!allowed.includes(biome[index])) continue;
          biome[index] = kind;
        }
      }
    }
  }
}

function placeVolcanoes(biome: Uint8Array, random: () => number) {
  const interior: { x: number; y: number }[] = [];
  const anyLava: { x: number; y: number }[] = [];
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      if (biome[y * worldWidth + x] !== lava) continue;
      const spot = { x, y };
      anyLava.push(spot);
      let inside = true;
      for (const [dx, dy] of [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= worldWidth || ny >= worldHeight) {
          inside = false;
          break;
        }
        if (biome[ny * worldWidth + nx] !== lava) {
          inside = false;
          break;
        }
      }
      if (inside) interior.push(spot);
    }
  }
  const pool = interior.length > 0 ? interior : anyLava;
  const count = Math.min(1 + Math.floor(random() * 3), pool.length);
  const order = pool.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }
  const chosen: { x: number; y: number }[] = [];
  const separated = (spot: { x: number; y: number }, reach: number) =>
    chosen.every((other) => {
      const dx = other.x - spot.x;
      const dy = other.y - spot.y;
      return dx * dx + dy * dy >= reach * reach;
    });
  for (const reach of [40, 0]) {
    for (const index of order) {
      if (chosen.length >= count) break;
      const spot = pool[index];
      if (chosen.some((other) => other.x === spot.x && other.y === spot.y))
        continue;
      if (!separated(spot, reach)) continue;
      chosen.push(spot);
    }
  }
  for (const spot of chosen) biome[spot.y * worldWidth + spot.x] = volcano;
}

function namePlace(
  random: () => number,
  usedNames: Set<string>,
  names: { evil?: string[]; lawful?: string[] },
  alignment?: "evil" | "lawful",
) {
  const evil =
    alignment === "evil" || (alignment !== "lawful" && random() < 0.25);
  const source = evil ? names.evil : names.lawful;
  const list = (source ?? []).filter((name) => !usedNames.has(name));
  const name = list[Math.floor(random() * list.length)];
  usedNames.add(name);
  return { name, evil };
}

function layRoad(
  biome: Uint8Array,
  from: { x: number; y: number },
  to: { x: number; y: number },
  isSpecial: (kind: number) => boolean,
) {
  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (x0 !== x1 || y0 !== y1) {
    const doubled = err * 2;
    if (x0 !== x1 && (y0 === y1 || doubled > -dy)) {
      err -= dy;
      x0 += sx;
    } else {
      err += dx;
      y0 += sy;
    }
    if (x0 === x1 && y0 === y1) break;
    const index = y0 * worldWidth + x0;
    if (!isSpecial(biome[index])) biome[index] = road;
  }
}

function cutSpace(biome: Uint8Array) {
  const halfW = worldWidth / 2;
  const halfH = worldHeight / 2;
  const rim = 12;

  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      if (
        x < rim ||
        y < rim ||
        x >= worldWidth - rim ||
        y >= worldHeight - rim
      ) {
        biome[y * worldWidth + x] = space;
        continue;
      }

      const px = (x + 0.5 - halfW) / halfW;
      const py = (y + 0.5 - halfH) / halfH;
      const dist = Math.hypot(px, py);
      if (dist < 0.22) continue;
      if (dist > 1.2) {
        biome[y * worldWidth + x] = space;
        continue;
      }

      const broad = field(x, y, 11000, 6400, 680, 300);
      const lobes = field(x, y, 2200, 17000, 240, 120);
      const height = (broad - 0.5) * 1.15 + (lobes - 0.5) * 0.42;
      const shore = (dist - 0.62) * 0.85;
      if (height < shore) biome[y * worldWidth + x] = space;
    }
  }
}

function carveRiver(
  x: number,
  y: number,
  elevation: Uint8Array,
  biome: Uint8Array,
) {
  for (let step = 0; step < 4096; step++) {
    if (x < 0 || y < 0 || x >= worldWidth || y >= worldHeight) return;
    const index = y * worldWidth + x;
    if (
      isWater(biome[index]) ||
      biome[index] === shallows ||
      biome[index] === river ||
      biome[index] === space
    )
      return;
    biome[index] = river;

    let nextX = -1;
    let nextY = -1;
    let lowest = elevation[index];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= worldWidth || ny >= worldHeight) continue;
        const height = elevation[ny * worldWidth + nx];
        if (height < lowest) {
          lowest = height;
          nextX = nx;
          nextY = ny;
        }
      }
    }

    if (nextX >= 0) {
      x = nextX;
      y = nextY;
      continue;
    }

    let targetX = x;
    let targetY = y;
    let targetHeight = elevation[index];
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= worldWidth || ny >= worldHeight) continue;
        const height = elevation[ny * worldWidth + nx];
        if (height < targetHeight) {
          targetHeight = height;
          targetX = nx;
          targetY = ny;
        }
      }
    }
    if (targetX === x && targetY === y) return;
    x += Math.sign(targetX - x);
    y += Math.sign(targetY - y);
  }
}
