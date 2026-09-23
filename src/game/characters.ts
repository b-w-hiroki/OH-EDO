import Phaser from "phaser";

/**
 * Soft chibi character textures for the light-anime art direction.
 *
 * These are deliberately drawn from smooth primitives rather than pixel cells,
 * so the in-game cast reads closer to the approved mock while still requiring
 * no external binary assets.
 */

export const CHAR_TEX_W = 104;
export const CHAR_TEX_H = 136;

export type CharKind =
  | "player"
  | "landlord"
  | "fishmonger"
  | "child"
  | "newsman"
  | "firechief";

export const CHAR_SCALE: Record<CharKind, number> = {
  player: 0.9,
  landlord: 0.88,
  fishmonger: 0.92,
  child: 0.72,
  newsman: 0.88,
  firechief: 0.94,
};

interface CharPalette {
  outline: number;
  skin: number;
  skinShadow: number;
  hair: number;
  kimono: number;
  kimonoShadow: number;
  obi: number;
  white: number;
  dark: number;
  blush: number;
  accent: number;
}

const PALETTES: Record<CharKind, CharPalette> = {
  player: {
    outline: 0x4b3528,
    skin: 0xf5d0a6,
    skinShadow: 0xddaa80,
    hair: 0x3a302b,
    kimono: 0x4f90bd,
    kimonoShadow: 0x376f96,
    obi: 0x6d4a37,
    white: 0xfff8e9,
    dark: 0x3d3128,
    blush: 0xe99c88,
    accent: 0xe66f55,
  },
  landlord: {
    outline: 0x4a382e,
    skin: 0xebc69d,
    skinShadow: 0xcda77d,
    hair: 0x6f6259,
    kimono: 0x7c6b58,
    kimonoShadow: 0x625241,
    obi: 0x4e4a4b,
    white: 0xf8efdc,
    dark: 0x40352d,
    blush: 0xda9a84,
    accent: 0xc8ab75,
  },
  fishmonger: {
    outline: 0x413126,
    skin: 0xf2c99d,
    skinShadow: 0xd7a777,
    hair: 0x2f2925,
    kimono: 0x376f9b,
    kimonoShadow: 0x295777,
    obi: 0xeee0c4,
    white: 0xfff7e8,
    dark: 0x382f28,
    blush: 0xe98e7b,
    accent: 0xdf5b4f,
  },
  child: {
    outline: 0x493529,
    skin: 0xf6d2aa,
    skinShadow: 0xdfb183,
    hair: 0x392f2a,
    kimono: 0x7ca359,
    kimonoShadow: 0x5c7d41,
    obi: 0xd9854e,
    white: 0xfff8ea,
    dark: 0x40342b,
    blush: 0xec907d,
    accent: 0xe5b957,
  },
  newsman: {
    outline: 0x443127,
    skin: 0xf1c99f,
    skinShadow: 0xd6a878,
    hair: 0x362e2a,
    kimono: 0x9d6685,
    kimonoShadow: 0x7c4b66,
    obi: 0x5d5541,
    white: 0xfff8e8,
    dark: 0x41342c,
    blush: 0xe79884,
    accent: 0xe9d9c2,
  },
  firechief: {
    outline: 0x3f2d24,
    skin: 0xf0c49a,
    skinShadow: 0xd19b6e,
    hair: 0x292522,
    kimono: 0x355f7d,
    kimonoShadow: 0x274960,
    obi: 0xcf6544,
    white: 0xfff5e5,
    dark: 0x342b25,
    blush: 0xdc8b76,
    accent: 0xe5bf58,
  },
};

function oval(
  g: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 1
): void {
  g.fillStyle(color, alpha);
  g.fillEllipse(x, y, w, h);
}

function rounded(
  g: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, h, r);
}

function strokeOval(
  g: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  w: number,
  h: number,
  width = 3
): void {
  g.lineStyle(width, color, 1);
  g.strokeEllipse(x, y, w, h);
}

function drawHair(
  g: Phaser.GameObjects.Graphics,
  p: CharPalette,
  kind: CharKind,
  cx: number,
  headY: number
): void {
  g.fillStyle(p.hair, 1);
  if (kind === "landlord") {
    g.fillEllipse(cx, headY - 14, 46, 22);
    g.fillRoundedRect(cx - 22, headY - 10, 44, 14, 7);
    g.fillEllipse(cx, headY - 25, 14, 9);
  } else {
    g.fillEllipse(cx, headY - 15, 51, 27);
    g.fillRoundedRect(cx - 24, headY - 12, 48, 17, 8);
  }

  if (kind === "player") {
    g.fillStyle(p.white, 1);
    g.fillRoundedRect(cx - 27, headY - 13, 54, 6, 3);
    g.fillTriangle(cx + 22, headY - 9, cx + 33, headY - 2, cx + 25, headY + 3);
  } else if (kind === "fishmonger") {
    g.fillStyle(p.white, 1);
    g.fillRoundedRect(cx - 28, headY - 12, 56, 7, 3);
    g.fillTriangle(cx + 23, headY - 8, cx + 34, headY - 1, cx + 25, headY + 4);
  } else if (kind === "firechief") {
    g.fillStyle(p.accent, 1);
    g.fillRoundedRect(cx - 29, headY - 13, 58, 7, 3);
    g.fillTriangle(cx - 22, headY - 9, cx - 34, headY - 1, cx - 25, headY + 4);
  }
}

function drawFace(
  g: Phaser.GameObjects.Graphics,
  p: CharPalette,
  kind: CharKind,
  cx: number,
  headY: number
): void {
  const eyeY = headY + 3;
  g.fillStyle(p.dark, 1);

  if (kind === "landlord") {
    g.lineStyle(2.5, p.dark, 1);
    g.beginPath();
    g.moveTo(cx - 13, eyeY - 1);
    g.lineTo(cx - 4, eyeY + 1);
    g.moveTo(cx + 4, eyeY + 1);
    g.lineTo(cx + 13, eyeY - 1);
    g.strokePath();
  } else {
    oval(g, p.dark, cx - 10, eyeY, 5, kind === "child" ? 7 : 6);
    oval(g, p.dark, cx + 10, eyeY, 5, kind === "child" ? 7 : 6);
    oval(g, p.white, cx - 9, eyeY - 1, 1.8, 2.2);
    oval(g, p.white, cx + 11, eyeY - 1, 1.8, 2.2);
  }

  oval(g, p.blush, cx - 18, headY + 11, 10, 5, 0.55);
  oval(g, p.blush, cx + 18, headY + 11, 10, 5, 0.55);

  g.lineStyle(2.2, p.dark, 1);
  g.beginPath();
  g.arc(cx, headY + 12, kind === "firechief" ? 6 : 7, 0.1, Math.PI - 0.1, false);
  g.strokePath();

  if (kind === "landlord" || kind === "firechief") {
    g.lineStyle(2, p.hair, 0.85);
    g.beginPath();
    g.moveTo(cx - 14, eyeY - 7);
    g.lineTo(cx - 5, eyeY - 8);
    g.moveTo(cx + 5, eyeY - 8);
    g.lineTo(cx + 14, eyeY - 7);
    g.strokePath();
  }
}

function drawProp(
  g: Phaser.GameObjects.Graphics,
  p: CharPalette,
  kind: CharKind,
  cx: number
): void {
  if (kind === "fishmonger") {
    g.fillStyle(0xd9e1df, 1);
    g.fillEllipse(cx - 28, 92, 26, 11);
    g.fillTriangle(cx - 41, 92, cx - 51, 85, cx - 51, 99);
    oval(g, p.dark, cx - 20, 90, 2.5, 2.5);
  } else if (kind === "newsman") {
    rounded(g, p.white, cx + 15, 79, 28, 35, 3);
    g.lineStyle(2, p.kimonoShadow, 0.65);
    g.lineBetween(cx + 20, 87, cx + 38, 87);
    g.lineBetween(cx + 20, 94, cx + 38, 94);
    g.lineBetween(cx + 20, 101, cx + 34, 101);
  } else if (kind === "firechief") {
    g.lineStyle(4, p.accent, 1);
    g.lineBetween(cx + 29, 69, cx + 29, 117);
    g.fillStyle(p.accent, 1);
    g.fillTriangle(cx + 29, 64, cx + 17, 74, cx + 41, 74);
    g.fillStyle(p.white, 1);
    g.fillTriangle(cx + 29, 67, cx + 23, 72, cx + 35, 72);
  } else if (kind === "player") {
    rounded(g, 0x765443, cx + 23, 72, 16, 31, 6);
    g.lineStyle(2, 0x4e382e, 1);
    g.lineBetween(cx + 26, 72, cx + 17, 58);
  }
}

function drawCharacter(
  g: Phaser.GameObjects.Graphics,
  kind: CharKind,
  frame: number
): void {
  const p = PALETTES[kind];
  const cx = CHAR_TEX_W / 2;
  const headY = kind === "child" ? 39 : 37;
  const bodyTop = kind === "child" ? 61 : 63;
  const bodyH = kind === "child" ? 43 : 48;
  const sleeveY = bodyTop + 13;
  const step = frame === 1 ? 3 : 0;

  // soft sticker-like silhouette
  oval(g, 0x000000, cx, 124, kind === "child" ? 54 : 66, 13, 0.13);

  // legs and sandals
  rounded(g, p.skinShadow, cx - 15 - step, 106, 11, 17, 5);
  rounded(g, p.skinShadow, cx + 4 + step, 106, 11, 17, 5);
  rounded(g, p.dark, cx - 20 - step, 119, 20, 7, 3);
  rounded(g, p.dark, cx + 1 + step, 119, 20, 7, 3);

  // sleeves
  rounded(g, p.outline, cx - 43, sleeveY - 2, 23, 31, 11);
  rounded(g, p.outline, cx + 20, sleeveY - 2, 23, 31, 11);
  rounded(g, p.kimono, cx - 40, sleeveY + (frame ? 2 : 0), 18, 26, 9);
  rounded(g, p.kimono, cx + 22, sleeveY + (frame ? 0 : 2), 18, 26, 9);

  // body outline + kimono
  rounded(g, p.outline, cx - 27, bodyTop - 3, 54, bodyH + 8, 16);
  rounded(g, p.kimono, cx - 24, bodyTop, 48, bodyH, 14);
  g.fillStyle(p.kimonoShadow, 1);
  g.fillTriangle(cx + 7, bodyTop, cx + 24, bodyTop + 7, cx + 24, bodyTop + bodyH - 2);
  g.fillTriangle(cx - 3, bodyTop + 17, cx + 8, bodyTop + 17, cx + 15, bodyTop + bodyH - 3);

  // collar
  g.fillStyle(p.white, 1);
  g.fillTriangle(cx - 13, bodyTop + 1, cx, bodyTop + 17, cx - 2, bodyTop + 2);
  g.fillTriangle(cx + 13, bodyTop + 1, cx, bodyTop + 17, cx + 2, bodyTop + 2);

  // obi
  rounded(g, p.obi, cx - 25, bodyTop + 27, 50, 10, 5);
  oval(g, p.accent, cx, bodyTop + 32, 12, 8);

  // neck
  rounded(g, p.skinShadow, cx - 7, headY + 20, 14, 14, 5);

  // head outline + head
  oval(g, p.outline, cx, headY, kind === "child" ? 57 : 62, kind === "child" ? 58 : 61);
  oval(g, p.skin, cx, headY + 1, kind === "child" ? 52 : 57, kind === "child" ? 53 : 56);

  // one-side face shadow for softer anime depth
  g.fillStyle(p.skinShadow, 0.28);
  g.fillEllipse(cx + 11, headY + 5, 24, 40);

  drawHair(g, p, kind, cx, headY);
  drawFace(g, p, kind, cx, headY);
  drawProp(g, p, kind, cx);

  // thin outer accents
  strokeOval(g, p.outline, cx, headY, kind === "child" ? 57 : 62, kind === "child" ? 58 : 61, 2);
}

interface TextureSpec {
  key: string;
  kind: CharKind;
  frame: number;
}

const TEXTURE_SPECS: TextureSpec[] = [
  { key: "char-player", kind: "player", frame: 0 },
  { key: "char-player-b", kind: "player", frame: 1 },
  { key: "char-landlord", kind: "landlord", frame: 0 },
  { key: "char-fishmonger", kind: "fishmonger", frame: 0 },
  { key: "char-child", kind: "child", frame: 0 },
  { key: "char-newsman", kind: "newsman", frame: 0 },
  { key: "char-firechief", kind: "firechief", frame: 0 },
];

export function buildCharacterTextures(scene: Phaser.Scene): void {
  for (const spec of TEXTURE_SPECS) {
    if (scene.textures.exists(spec.key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 });
    drawCharacter(g, spec.kind, spec.frame);
    g.generateTexture(spec.key, CHAR_TEX_W, CHAR_TEX_H);
    g.destroy();
  }
}
