"use client";

import { useEffect, useRef } from "react";
import { itemDetailLines } from "./items";
import {
  canOccupy,
  characterGlyph,
  classes,
  clampPlayer,
  classMarks,
  createParty,
  partyAlive,
  skillNames,
  tryRecruit,
} from "./player";
import {
  biomeRgb,
  biomes,
  castle,
  cave,
  floatingCastle,
  graveyard,
  road,
  ruins,
  shrine,
  space,
  temple,
  village,
  wizardTower,
} from "./tiles";
import {
  generateWorld,
  type AlignedPlace,
  type Castle,
  type NamedPlace,
  type Village,
  type WizardTower,
  hash,
  worldHeight,
  worldSeed,
  worldWidth,
} from "./world";

const viewWidth = 1024;
const viewHeight = 768;
const tileSize = 16;
const miniWidth = 256;
const miniHeight = 192;
const miniMargin = 8;
const visionRadius = 12;

function paintMinimap(
  canvas: HTMLCanvasElement,
  world: Uint8Array,
  explored: Uint8Array,
  originX: number,
  originY: number,
  spanX: number,
  spanY: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const image = ctx.createImageData(miniWidth, miniHeight);
  const data = image.data;
  const scaleX = spanX / miniWidth;
  const scaleY = spanY / miniHeight;

  for (let y = 0; y < miniHeight; y++) {
    const worldY = Math.min(
      worldHeight - 1,
      Math.max(0, Math.floor(originY + y * scaleY)),
    );
    for (let x = 0; x < miniWidth; x++) {
      const worldX = Math.min(
        worldWidth - 1,
        Math.max(0, Math.floor(originX + x * scaleX)),
      );
      const seen = explored[worldY * worldWidth + worldX] === 1;
      const [r, g, b] = seen
        ? biomeRgb[world[worldY * worldWidth + worldX]]
        : [0, 0, 0];
      const index = (y * miniWidth + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
}

function makeRoadGlyphs() {
  const color = biomes[road].color;
  const thickness = 4;
  const inset = (tileSize - thickness) / 2;
  const half = tileSize / 2;
  return Array.from({ length: 16 }, (_, mask) => {
    const canvas = document.createElement("canvas");
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    ctx.fillStyle = color;
    if (mask === 0) {
      ctx.fillRect(inset, inset, thickness, thickness);
      return canvas;
    }
    if (mask & 1) ctx.fillRect(inset, 0, thickness, half + thickness / 2);
    if (mask & 4)
      ctx.fillRect(
        inset,
        half - thickness / 2,
        thickness,
        half + thickness / 2,
      );
    if (mask & 8) ctx.fillRect(0, inset, half + thickness / 2, thickness);
    if (mask & 2)
      ctx.fillRect(
        half - thickness / 2,
        inset,
        half + thickness / 2,
        thickness,
      );
    return canvas;
  });
}

function glowColor(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, 0.75)`;
}

function roadLinks(world: Uint8Array, x: number, y: number) {
  const linked = (nx: number, ny: number) => {
    if (nx < 0 || ny < 0 || nx >= worldWidth || ny >= worldHeight) return false;
    const kind = world[ny * worldWidth + nx];
    return kind === road || kind === castle || kind === village;
  };
  let mask = 0;
  if (linked(x, y - 1)) mask |= 1;
  if (linked(x + 1, y)) mask |= 2;
  if (linked(x, y + 1)) mask |= 4;
  if (linked(x - 1, y)) mask |= 8;
  return mask;
}

function paintGlyph(
  ctx: CanvasRenderingContext2D,
  picture: HTMLCanvasElement,
  col: number,
  row: number,
) {
  ctx.drawImage(
    picture,
    col * tileSize + (tileSize - picture.width) / 2,
    row * tileSize + (tileSize - picture.height) / 2,
  );
}

function makeGlyphs() {
  const larger = new Set([
    castle,
    floatingCastle,
    graveyard,
    temple,
    shrine,
    cave,
    ruins,
    wizardTower,
  ]);
  return biomes.map((biome, kind) =>
    biome.symbols.map((symbol) => {
      const size = larger.has(kind) ? 22 : tileSize;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return canvas;
      ctx.fillStyle = biome.color;
      ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(symbol, size / 2, size / 2);
      return canvas;
    }),
  );
}

export default function TextWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const glyphs = makeGlyphs();
    const roadGlyphs = makeRoadGlyphs();
    const tilesAcross = viewWidth / tileSize;
    const tilesDown = viewHeight / tileSize;
    const generated = generateWorld();
    let world = generated.biome;
    const castles: Castle[] = generated.castles;
    const towns: Village[] = generated.towns;
    const temples: Castle[] = generated.temples;
    const shrines: Castle[] = generated.shrines;
    const caves: NamedPlace[] = generated.caves;
    const floatingCastles: AlignedPlace[] = generated.floatingCastles;
    const graveyards: AlignedPlace[] = generated.graveyards;
    const wizardTowers: WizardTower[] = generated.wizardTowers;
    const explored = new Uint8Array(worldWidth * worldHeight);
    const revealAround = (x: number, y: number) => {
      const reach = visionRadius * visionRadius;
      for (let dy = -visionRadius; dy <= visionRadius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= worldHeight) continue;
        for (let dx = -visionRadius; dx <= visionRadius; dx++) {
          if (dx * dx + dy * dy > reach) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= worldWidth) continue;
          explored[ny * worldWidth + nx] = 1;
        }
      }
    };
    const minimap = document.createElement("canvas");
    minimap.width = miniWidth;
    minimap.height = miniHeight;
    let cameraX = 0;
    let cameraY = 0;
    const party = createParty(world);
    let selected = 0; // represents the currently selected player character
    let blockedMessage = "";
    const minimapZooms = ["off", "medium", "whole"] as const;
    let minimapZoom: (typeof minimapZooms)[number] = "medium";

    // informational menus
    let showTileInfo = true; // f
    let showInventory = false; // i
    let showHelp = false; // h
    let showLegend = false; // l
    let showMapInfo = false; // m
    let showCharacterSheet = false; // c
    // these abilities will be on timers
    let showGathering = false; // g
    let showMining = false; // n
    let showSearching = false; // s
    let showDigging = false; // d
    let showPraying = false; // p
    // actions not on a timer, like entering a town / shrine / graveyard / cave / dungeon / castle / temple / etc...
    let isEntering = false; // e
    // game handled events
    let showCombat = false;

    const clampCamera = () => {
      cameraX = Math.min(worldWidth - tilesAcross, Math.max(0, cameraX));
      cameraY = Math.min(worldHeight - tilesDown, Math.max(0, cameraY));
    };

    const centerViewOnPlayer = () => {
      const player = party[selected];
      cameraX = player.x - Math.floor(tilesAcross / 2);
      cameraY = player.y - Math.floor(tilesDown / 2);
      clampCamera();
    };

    const minimapOrigin = () => ({
      x: viewWidth - miniWidth - miniMargin,
      y: miniMargin,
    });

    const minimapFrame = () => {
      if (minimapZoom === "off") return null;
      const spanX =
        minimapZoom === "whole"
          ? worldWidth / 2
          : Math.min(worldWidth, (800 * 2) / tileSize);
      const spanY =
        minimapZoom === "whole"
          ? worldHeight / 2
          : Math.min(worldHeight, spanX * (miniHeight / miniWidth));
      const focus = party[selected];
      const originX = Math.min(
        worldWidth - spanX,
        Math.max(0, focus.x + 0.5 - spanX / 2),
      );
      const originY = Math.min(
        worldHeight - spanY,
        Math.max(0, focus.y + 0.5 - spanY / 2),
      );
      return { originX, originY, spanX, spanY };
    };

    const draw = () => {
      const player = party[selected];
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, viewWidth, viewHeight);
      for (let row = 0; row < tilesDown; row++) {
        const y = cameraY + row;
        for (let col = 0; col < tilesAcross; col++) {
          const x = cameraX + col;
          if (explored[y * worldWidth + x] !== 1) continue;
          const kind = world[y * worldWidth + x];
          if (kind === space) continue;
          if (kind === road) {
            ctx.drawImage(
              roadGlyphs[roadLinks(world, x, y)],
              col * tileSize,
              row * tileSize,
            );
            continue;
          }
          const pictures = glyphs[kind];
          const picture = pictures[hash(x, y) % pictures.length];
          paintGlyph(ctx, picture, col, row);
        }
      }

      ctx.save();
      ctx.shadowBlur = 20;
      for (let row = 0; row < tilesDown; row++) {
        const y = cameraY + row;
        for (let col = 0; col < tilesAcross; col++) {
          const x = cameraX + col;
          if (explored[y * worldWidth + x] !== 1) continue;
          const kind = world[y * worldWidth + x];
          if (
            kind !== village &&
            kind !== castle &&
            kind !== floatingCastle &&
            kind !== graveyard &&
            kind !== temple &&
            kind !== shrine &&
            kind !== cave &&
            kind !== ruins &&
            kind !== wizardTower
          ) {
            continue;
          }
          ctx.shadowColor =
            kind === village
              ? "rgba(255, 196, 64, 0.65)"
              : glowColor(biomes[kind].color);
          const pictures = glyphs[kind];
          const picture = pictures[hash(x, y) % pictures.length];
          paintGlyph(ctx, picture, col, row);
          paintGlyph(ctx, picture, col, row);
          paintGlyph(ctx, picture, col, row);
        }
      }
      ctx.restore();

      const drawMember = (member: (typeof party)[number]) => {
        if (!member.alive) return;
        if (
          member.x < cameraX ||
          member.x >= cameraX + tilesAcross ||
          member.y < cameraY ||
          member.y >= cameraY + tilesDown
        ) {
          return;
        }
        ctx.save();
        ctx.shadowBlur = 24;
        ctx.shadowColor =
          member.alignment === "lawful"
            ? "rgba(255, 255, 255, 1)"
            : "rgba(255, 48, 48, 1)";
        const glyph = characterGlyph(tileSize, member);
        const glyphX =
          (member.x - cameraX) * tileSize + (tileSize - glyph.width) / 2;
        const glyphY =
          (member.y - cameraY) * tileSize + (tileSize - glyph.height) / 2;
        ctx.drawImage(glyph, glyphX, glyphY);
        ctx.drawImage(glyph, glyphX, glyphY);
        ctx.drawImage(glyph, glyphX, glyphY);
        ctx.restore();
      };
      party.forEach((member, index) => {
        if (index !== selected) drawMember(member);
      });
      drawMember(player);

      const frame = minimapFrame();
      if (frame) {
        const { x: miniX, y: miniY } = minimapOrigin();
        paintMinimap(
          minimap,
          world,
          explored,
          frame.originX,
          frame.originY,
          frame.spanX,
          frame.spanY,
        );
        ctx.drawImage(minimap, miniX, miniY);
        ctx.save();
        ctx.beginPath();
        ctx.rect(miniX, miniY, miniWidth, miniHeight);
        ctx.clip();
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          miniX + ((cameraX - frame.originX) / frame.spanX) * miniWidth + 0.5,
          miniY + ((cameraY - frame.originY) / frame.spanY) * miniHeight + 0.5,
          (tilesAcross / frame.spanX) * miniWidth,
          (tilesDown / frame.spanY) * miniHeight,
        );
        for (const member of party) {
          if (!member.alive) continue;
          const mark = classMarks[member.class];
          const lawful = member.alignment === "lawful";
          const markerX =
            miniX +
            ((member.x + 0.5 - frame.originX) / frame.spanX) * miniWidth;
          const markerY =
            miniY +
            ((member.y + 0.5 - frame.originY) / frame.spanY) * miniHeight;
          const size = member === player ? 4 : 2;
          ctx.fillStyle = lawful ? mark.lawfulEdge : mark.evilEdge;
          ctx.fillRect(
            markerX - size / 2 - 1,
            markerY - size / 2 - 1,
            size + 2,
            size + 2,
          );
          ctx.fillStyle = lawful ? mark.lawful : mark.evil;
          ctx.fillRect(markerX - size / 2, markerY - size / 2, size, size);
        }
        ctx.restore();
      }

      ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const pad = 8;
      const lineHeight = 20;

      const centerX = cameraX + Math.floor(tilesAcross / 2);
      const centerY = cameraY + Math.floor(tilesDown / 2);
      const coord = `${centerX}, ${centerY}`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      const coordWidth = ctx.measureText(coord).width;
      ctx.fillStyle = "#000";
      ctx.fillRect(
        viewWidth - coordWidth - pad * 2,
        viewHeight - lineHeight - pad,
        coordWidth + pad * 2,
        lineHeight + pad,
      );
      ctx.fillStyle = "#fff";
      ctx.fillText(coord, viewWidth - pad, viewHeight - pad);

      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // react to inputs

      // informational menus
      // f
      if (showTileInfo) {
        const tile = biomes[world[player.y * worldWidth + player.x]];
        const here = (entry: { x: number; y: number }) =>
          entry.x === player.x && entry.y === player.y;
        const castleHere = castles.find(here);
        const towerHere = wizardTowers.find(here);
        const townHere = towns.find(here);
        const templeHere = temples.find(here);
        const shrineHere = shrines.find(here);
        const namedPlace = caves.find(here);
        const lines = castleHere
          ? [
              `Info (f)`,
              ``,
              `Castle ${castleHere.name}`,
              `level ${castleHere.level}`,
              ``,
              `alignment: ${castleHere.evil ? "evil" : "lawful"}`,
              `ruled by: ${castleHere.ruler}`,
              ``,
              `wealth: ${castleHere.wealth}`,
              `defenses: ${castleHere.defenses}`,
              `population: ${castleHere.population}`,
              castleHere.resources.length > 0
                ? `goods: ${castleHere.resources.join(", ")}`
                : "goods: none",
              castleHere.utility.length > 0
                ? `services: ${castleHere.utility.join(", ")}`
                : "services: none",
            ]
          : towerHere
            ? [
                `Info (f)`,
                "Wizard tower",
                `level ${towerHere.level}`,
                `alignment: ${towerHere.evil ? "evil" : "lawful"}`,
                `ruled by: ${towerHere.ruler}`,
                `wealth: ${towerHere.wealth}`,
                `defenses: ${towerHere.defenses}`,
                `treasure: ${towerHere.treasure}`,
              ]
            : townHere
              ? [
                  `Info (f)`,
                  `Village ${townHere.name}`,
                  `level ${townHere.level}`,
                  `alignment: ${townHere.evil ? "evil" : "lawful"}`,
                  `ruled by: ${townHere.ruler}`,
                  `wealth ${townHere.wealth}`,
                  `defenses ${townHere.defenses}`,
                  `population ${townHere.population}`,
                  townHere.resources.length > 0
                    ? `goods: ${townHere.resources.join(", ")}`
                    : "goods: none",
                  townHere.utility.length > 0
                    ? `services: ${townHere.utility.join(", ")}`
                    : "services: none",
                ]
              : templeHere
                ? [
                    `Info (f)`,
                    `Temple ${templeHere.name}`,
                    `level ${templeHere.level}`,
                    `alignment: ${templeHere.evil ? "evil" : "lawful"}`,
                    `ruled by: ${templeHere.ruler}`,
                    `wealth: ${templeHere.wealth}`,
                    `defenses: ${templeHere.defenses}`,
                    `population: ${templeHere.population}`,
                    templeHere.resources.length > 0
                      ? `goods: ${templeHere.resources.join(", ")}`
                      : "goods: none",
                    templeHere.utility.length > 0
                      ? `services: ${templeHere.utility.join(", ")}`
                      : "services: none",
                  ]
                : shrineHere
                  ? [
                      `Info (f)`,
                      `Shrine ${shrineHere.name}`,
                      `level ${shrineHere.level}`,
                      `alignment: ${shrineHere.evil ? "evil" : "lawful"}`,
                      `ruled by: ${shrineHere.ruler}`,
                      `wealth: ${shrineHere.wealth}`,
                      `defenses: ${shrineHere.defenses}`,
                      `population: ${shrineHere.population}`,
                      shrineHere.resources.length > 0
                        ? `goods: ${shrineHere.resources.join(", ")}`
                        : "goods: none",
                      shrineHere.utility.length > 0
                        ? `services: ${shrineHere.utility.join(", ")}`
                        : "services: none",
                    ]
                  : namedPlace
                    ? [namedPlace.name, namedPlace.evil ? "evil" : "lawful"]
                    : [tile.name];
        const boxWidth =
          Math.max(...lines.map((line) => ctx.measureText(line).width)) +
          pad * 2;
        const boxHeight = lines.length * lineHeight + pad * 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(8, 8, boxWidth, boxHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, 8.5, boxWidth, boxHeight);
        ctx.fillStyle = "#fff";
        lines.forEach((line, index) => {
          ctx.fillText(line, 8 + pad, 8 + pad + index * lineHeight);
        });
      }

      // i
      if (showInventory) {
        const lines = ["Inventory (i)"];
        if (player.inventory.length === 0) lines.push("empty");
        for (const item of player.inventory) {
          lines.push("", item.name, ...itemDetailLines(item));
        }
        const boxWidth =
          Math.max(...lines.map((line) => ctx.measureText(line).width)) +
          pad * 2;
        const boxHeight = lines.length * lineHeight + pad * 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(8, 8, boxWidth, boxHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, 8.5, boxWidth, boxHeight);
        ctx.fillStyle = "#fff";
        lines.forEach((line, index) => {
          ctx.fillText(line, 8 + pad, 8 + pad + index * lineHeight);
        });
      }

      // h
      if (showHelp) {
        const keys = [
          ``,
          "f  tile info",
          "i  inventory",
          "h  help",
          "l  legend",
          "m  map info",
          "c  character",
          "g  gather (if allowed by character class)",
          "n  mine (if allowed by character class)",
          "s  search area",
          "d  dig (if allowed by character class)",
          "r  recruit",
          "p  pray (if allowed by character class)",
          "e  enter town / shrine / graveyard / cave / dungeon / castle / temple / etc...",
          "tab  next character",
          "arrows  move",
          "z  minimap zoom",
        ];
        const boxWidth =
          pad * 2 +
          Math.max(
            ...["Help (h)", ...keys].map((line) => ctx.measureText(line).width),
          );
        const boxHeight = (keys.length + 1) * lineHeight + pad * 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(8, 8, boxWidth, boxHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, 8.5, boxWidth, boxHeight);
        ctx.fillStyle = "#fff";
        ctx.fillText("Help (h)", 8 + pad, 8 + pad);
        keys.forEach((key, index) => {
          ctx.fillText(key, 8 + pad, 8 + pad + (index + 1) * lineHeight);
        });
      }

      // l
      if (showLegend) {
        const specialOrder = [
          "Shrine",
          "Temple",
          "Volcano",
          "Castle",
          "Village",
          "Cave",
          "Road",
          "Ruins",
          "Farmland",
          "Graveyard",
          "Wizard tower",
        ];
        const rows = biomes.map((biome) => ({
          symbols: biome.symbols.join(" "),
          color: biome.color,
          name: biome.name,
        }));
        const specials = specialOrder.flatMap((name) => {
          const row = rows.find((entry) => entry.name === name);
          return row ? [row] : [];
        });
        const terrain = rows.filter((row) => !specialOrder.includes(row.name));
        const players = classes.map((name) => ({
          symbols: classMarks[name].glyph,
          color: classMarks[name].lawful,
          name,
        }));
        const gap = 16;
        const columnGap = 32;
        const terrainSymbols = Math.max(
          ...terrain.map((row) => ctx.measureText(row.symbols).width),
        );
        const terrainNames = Math.max(
          ...terrain.map((row) => ctx.measureText(row.name).width),
        );
        const rightRows = [...players, ...specials];
        const rightSymbols = Math.max(
          ...rightRows.map((row) => ctx.measureText(row.symbols).width),
        );
        const rightNames = Math.max(
          ...rightRows.map((row) => ctx.measureText(row.name).width),
        );
        const terrainWidth = terrainSymbols + gap + terrainNames;
        const boxWidth =
          pad * 2 +
          Math.max(
            ctx.measureText("Legend (l)").width,
            terrainWidth + columnGap + rightSymbols + gap + rightNames,
          );
        const rightLength = players.length + 1 + specials.length;
        const boxHeight =
          (Math.max(terrain.length, rightLength) + 1) * lineHeight + pad * 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(8, 8, boxWidth, boxHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, 8.5, boxWidth, boxHeight);
        ctx.fillStyle = "#fff";
        ctx.fillText("Legend (l)", 8 + pad, 8 + pad);
        const drawColumn = (
          entries: { symbols: string; color: string; name: string }[],
          x: number,
          symbolWidth: number,
          startIndex = 0,
        ) => {
          entries.forEach((entry, index) => {
            const y = 8 + pad + (startIndex + index + 1) * lineHeight;
            ctx.fillStyle = entry.color;
            ctx.fillText(entry.symbols, x, y);
            ctx.fillStyle = "#fff";
            ctx.fillText(entry.name, x + symbolWidth + gap, y);
          });
        };
        const rightX = 8 + pad + terrainWidth + columnGap;
        drawColumn(terrain, 8 + pad, terrainSymbols);
        drawColumn(players, rightX, rightSymbols);
        drawColumn(specials, rightX, rightSymbols, players.length + 1);
      }

      // m
      if (showMapInfo) {
        const groups = [
          ["floating castle", floatingCastles],
          ["castles", castles],
          ["wizard towers", wizardTowers],
          ["towns", towns],
          ["caves", caves],
          ["temples", temples],
          ["shrines", shrines],
          ["graveyards", graveyards],
        ] as const;
        const lines: string[] = [];
        let evilCount = 0;
        let total = 0;
        for (const [label, places] of groups) {
          let evil = 0;
          for (const place of places) if (place.evil) evil += 1;
          const lawful = places.length - evil;
          evilCount += evil;
          total += places.length;
          lines.push(label);
          if (evil > 0) lines.push(`  ${evil} evil`);
          if (lawful > 0) lines.push(`  ${lawful} lawful`);
        }
        lines.push(
          `map: ${evilCount === 0 || evilCount === total ? "complete" : "incomplete"}`,
        );
        lines.push(`seed: ${worldSeed}`);
        const boxWidth =
          Math.max(...lines.map((line) => ctx.measureText(line).width)) +
          pad * 2;
        const boxHeight = lines.length * lineHeight + pad * 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(8, 8, boxWidth, boxHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, 8.5, boxWidth, boxHeight);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach((line, index) => {
          ctx.fillText(line, 8 + pad, 8 + pad + index * lineHeight);
        });
      }

      // c
      if (showCharacterSheet) {
        const lines = [
          "Character (c)",
          ``,
          player.name,
          `${player.alignment} ${player.race} ${player.class}`,
          `level ${player.level}`,
          `hp ${player.health}/${player.maxHealth}`,
          `exp ${player.experience}`,
          ``,
          `str ${player.strength}`,
          `dex ${player.dexterity}`,
          `con ${player.constitution}`,
          `int ${player.intelligence}`,
          `wis ${player.wisdom}`,
          `cha ${player.charisma}`,
          ``,
        ];
        for (const name of skillNames) {
          const bonus = player.skills[name];
          if (bonus) lines.push(`${name} ${bonus}`);
        }

        const boxWidth =
          Math.max(...lines.map((line) => ctx.measureText(line).width)) +
          pad * 2;
        const boxHeight = lines.length * lineHeight + pad * 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(8, 8, boxWidth, boxHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, 8.5, boxWidth, boxHeight);
        ctx.fillStyle = "#fff";
        lines.forEach((line, index) => {
          ctx.fillText(line, 8 + pad, 8 + pad + index * lineHeight);
        });
      }

      // these abilities will be on timers
      // g
      if (showGathering) {
      }

      // n
      if (showMining) {
      }

      // s
      if (showSearching) {
      }

      // d
      if (showDigging) {
      }

      // p
      if (showPraying) {
      }

      // actions not on a timer, like entering a town / shrine / graveyard / cave / dungeon / castle / temple / etc...
      // e
      if (isEntering) {
      }

      // game handled events
      if (showCombat) {
      }

      if (blockedMessage) {
        ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const textWidth = ctx.measureText(blockedMessage).width;
        const boxWidth = textWidth + pad * 2;
        const boxHeight = lineHeight + pad;
        const boxX = viewWidth / 2 - boxWidth / 2;
        const boxY = viewHeight - boxHeight - pad;
        ctx.fillStyle = "#000";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxWidth, boxHeight);
        ctx.fillStyle = "#fff";
        ctx.fillText(blockedMessage, viewWidth / 2, viewHeight - pad * 2);
      }

      // game over
      if (!partyAlive(party)) {
        const text = "game over";
        ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = "#000";
        ctx.fillRect(
          viewWidth / 2 - textWidth / 2 - pad,
          viewHeight / 2 - lineHeight / 2 - pad / 2,
          textWidth + pad * 2,
          lineHeight + pad,
        );
        ctx.fillStyle = "#fff";
        ctx.fillText(text, viewWidth / 2, viewHeight / 2);
      }
    };

    // define key handlers
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const takeMenu = (open: boolean) => {
        const next = !open;
        showTileInfo = false;
        showInventory = false;
        showHelp = false;
        showLegend = false;
        showMapInfo = false;
        showCharacterSheet = false;
        showGathering = false;
        showMining = false;
        showSearching = false;
        showDigging = false;
        showPraying = false;
        isEntering = false;
        return next;
      };

      // informational menus
      if (key === "f") {
        showTileInfo = takeMenu(showTileInfo);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "i") {
        showInventory = takeMenu(showInventory);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "h") {
        showHelp = takeMenu(showHelp);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "l") {
        showLegend = takeMenu(showLegend);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "m") {
        showMapInfo = takeMenu(showMapInfo);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "c") {
        showCharacterSheet = takeMenu(showCharacterSheet);
        event.preventDefault();
        draw();
        return;
      }

      // these abilities will be on timers

      if (key === "g") {
        showGathering = takeMenu(showGathering);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "n") {
        showMining = takeMenu(showMining);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "s") {
        showSearching = takeMenu(showSearching);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "d") {
        showDigging = takeMenu(showDigging);
        event.preventDefault();
        draw();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        const player = party[selected];
        if (!partyAlive(party) || !player.alive) return;
        const id = world[player.y * worldWidth + player.x];
        const here = (entry: { x: number; y: number }) =>
          entry.x === player.x && entry.y === player.y;
        const site =
          id === castle
            ? (castles.find(here) ?? null)
            : id === village
              ? (towns.find(here) ?? null)
              : id === floatingCastle
                ? (floatingCastles.find(here) ?? null)
                : id === temple
                  ? (temples.find(here) ?? null)
                  : id === shrine
                    ? (shrines.find(here) ?? null)
                    : id === wizardTower
                      ? (wizardTowers.find(here) ?? null)
                      : null;
        const recruitKind =
          id === castle
            ? "castle"
            : id === village
              ? "village"
              : id === floatingCastle
                ? "floatingCastle"
                : id === temple
                  ? "temple"
                  : id === shrine
                    ? "shrine"
                    : id === wizardTower
                      ? "wizardTower"
                      : null;
        blockedMessage = tryRecruit(
          party,
          player,
          site,
          site ? recruitKind : null,
        );
        draw();
        return;
      }

      if (key === "p") {
        showPraying = takeMenu(showPraying);
        event.preventDefault();
        draw();
        return;
      }

      // actions not on a timer, like entering a town / shrine / graveyard / cave / dungeon / castle / temple / etc...
      if (key === "e") {
        isEntering = takeMenu(isEntering);
        event.preventDefault();
        draw();
        return;
      }

      // game handled events. Tab and arrows keep event.key, since lowercasing those names is a different string.

      if (key === "z") {
        const index = minimapZooms.indexOf(minimapZoom);
        minimapZoom = minimapZooms[(index + 1) % minimapZooms.length];
        event.preventDefault();
        draw();
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        if (!partyAlive(party)) return;
        for (let step = 1; step <= party.length; step++) {
          const index = (selected + step) % party.length;
          if (!party[index].alive) continue;
          selected = index;
          break;
        }
        centerViewOnPlayer();
        draw();
        return;
      }

      const player = party[selected];
      if (!partyAlive(party) || !player.alive) return;

      let nextX = player.x;
      let nextY = player.y;
      if (event.key === "ArrowLeft") nextX -= 1;
      else if (event.key === "ArrowRight") nextX += 1;
      else if (event.key === "ArrowUp") nextY -= 1;
      else if (event.key === "ArrowDown") nextY += 1;
      else {
        return;
      }

      event.preventDefault();
      if (!canOccupy(player, world, nextX, nextY)) {
        const onMap =
          nextX >= 0 && nextY >= 0 && nextX < worldWidth && nextY < worldHeight;
        const terrain = onMap
          ? biomes[world[nextY * worldWidth + nextX]].type
          : "the edge of the map";
        blockedMessage = `That way is blocked by ${terrain}.`;
        centerViewOnPlayer();
        draw();
        return;
      }
      blockedMessage = "";
      player.x = nextX;
      player.y = nextY;
      clampPlayer(player);
      revealAround(player.x, player.y);
      centerViewOnPlayer();
      draw();
    };

    let draggingMinimap = false;

    const centerOnMinimapPoint = (event: PointerEvent) => {
      const frame = minimapFrame();
      if (!frame) return false;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * viewWidth;
      const y = ((event.clientY - rect.top) / rect.height) * viewHeight;
      const { x: miniX, y: miniY } = minimapOrigin();
      if (
        x < miniX ||
        y < miniY ||
        x >= miniX + miniWidth ||
        y >= miniY + miniHeight
      )
        return false;

      const worldX = frame.originX + ((x - miniX) / miniWidth) * frame.spanX;
      const worldY = frame.originY + ((y - miniY) / miniHeight) * frame.spanY;
      cameraX = Math.floor(worldX - tilesAcross / 2);
      cameraY = Math.floor(worldY - tilesDown / 2);
      clampCamera();
      draw();
      return true;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!centerOnMinimapPoint(event)) return;
      draggingMinimap = true;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingMinimap) return;
      centerOnMinimapPoint(event);
    };

    const endMinimapDrag = () => {
      draggingMinimap = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endMinimapDrag);
    canvas.addEventListener("pointercancel", endMinimapDrag);
    window.addEventListener("keydown", onKeyDown);

    for (const member of party) {
      if (member.alive) revealAround(member.x, member.y);
    }
    centerViewOnPlayer();
    draw();

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endMinimapDrag);
      canvas.removeEventListener("pointercancel", endMinimapDrag);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1024px] px-4 py-6">
      <canvas
        ref={canvasRef}
        width={viewWidth}
        height={viewHeight}
        className="bg-black"
      />
    </main>
  );
}
