import Phaser from "phaser";

/**
 * Hand-authored chibi pixel-art sprites for the Edo cast.
 *
 * Each character is drawn on an 18x24 cell grid (CELL px per cell) with a
 * two-pass technique: an inflated dark "outline" pass, then the colour pass.
 * Faces and held props are colour-only so they don't get a hard outline.
 */

const CELL = 3;
const GRID_W = 18;
const GRID_H = 24;

export const CHAR_TEX_W = GRID_W * CELL; // 54
export const CHAR_TEX_H = GRID_H * CELL; // 72

export type CharKind =
  | "player"
  | "landlord"
  | "fishmonger"
  | "child"
  | "newsman";

/** On-screen scale per character (the child is smaller). */
export const CHAR_SCALE: Record<CharKind, number> = {
  player: 1,
  landlord: 1,
  fishmonger: 1,
  child: 0.72,
  newsman: 1,
};

interface CharPalette {
  outline: number;
  skin: number;
  skinSh: number;
  hair: number;
  kimono: number;
  kimonoSh: number;
  obi: number;
  white: number;
  dark: number;
  eye: number;
  blush: number;
  accent: number;
}

const PALETTES: Record<CharKind, CharPalette> = {
  player: {
    outline: 0x2a1d12,
    skin: 0xf4cfa3,
    skinSh: 0xd9ab7d,
    hair: 0x3a312a,
    kimono: 0xd9683a,
    kimonoSh: 0xab4f28,
    obi: 0x46697c,
    white: 0xefe6d4,
    dark: 0x4a3b2a,
    eye: 0x241a14,
    blush: 0xe8917c,
    accent: 0xe8c878,
  },
  landlord: {
    outline: 0x2a1d12,
    skin: 0xeac49a,
    skinSh: 0xcda174,
    hair: 0x9c968c,
    kimono: 0x6c5c46,
    kimonoSh: 0x4f4234,
    obi: 0x3c3a44,
    white: 0xe7ddca,
    dark: 0x40342a,
    eye: 0x2a2018,
    blush: 0xd99a82,
    accent: 0xb8a98a,
  },
  fishmonger: {
    outline: 0x22180f,
    skin: 0xf3c898,
    skinSh: 0xd6a06f,
    hair: 0x2c2620,
    kimono: 0x3f7d99,
    kimonoSh: 0x2c5b71,
    obi: 0xd8c9a8,
    white: 0xede3d1,
    dark: 0x3a3026,
    eye: 0x201712,
    blush: 0xe8917c,
    accent: 0xd64a3e,
  },
  child: {
    outline: 0x2a1d12,
    skin: 0xf6d0a4,
    skinSh: 0xddae7e,
    hair: 0x3a302a,
    kimono: 0x6f9a52,
    kimonoSh: 0x537b3a,
    obi: 0xd98a4a,
    white: 0xefe6d4,
    dark: 0x4a3b2a,
    eye: 0x241a14,
    blush: 0xe88e78,
    accent: 0xe8c060,
  },
  newsman: {
    outline: 0x241a12,
    skin: 0xf1c79a,
    skinSh: 0xd4a06f,
    hair: 0x352c28,
    kimono: 0x9a5a7a,
    kimonoSh: 0x76425c,
    obi: 0x4a4636,
    white: 0xefe7d6,
    dark: 0x453626,
    eye: 0x231a13,
    blush: 0xe8917c,
    accent: 0xece2d0,
  },
};

const FISH_SILVER = 0xccd2cf;

type Pen = (
  color: number,
  x: number,
  y: number,
  w: number,
  h: number
) => void;

/** Body shapes — drawn in both the outline and the colour pass. */
function drawBody(pen: Pen, P: CharPalette, kind: CharKind, frame: number): void {
  // Legs + feet (the walk frame nudges one leg).
  if (frame === 0) {
    pen(P.skin, 6, 19, 2, 3);
    pen(P.skin, 10, 19, 2, 3);
    pen(P.dark, 5, 21, 3, 2);
    pen(P.dark, 10, 21, 3, 2);
  } else {
    pen(P.skin, 6, 19, 2, 2);
    pen(P.skin, 10, 19, 2, 3);
    pen(P.dark, 5, 20, 3, 2);
    pen(P.dark, 10, 21, 3, 2);
  }

  // Kimono body.
  pen(P.kimono, 5, 11, 8, 8);
  pen(P.kimono, 4, 17, 10, 2);
  pen(P.kimonoSh, 11, 11, 2, 8);
  pen(P.kimonoSh, 4, 18, 10, 1);
  pen(P.kimonoSh, 8, 13, 1, 5);

  // Big Edo sleeves (they swing with the walk frame).
  const lY = 12 + (frame === 1 ? 1 : 0);
  const rY = 12 + (frame === 1 ? 0 : 1);
  pen(P.kimono, 2, lY, 3, 6);
  pen(P.kimonoSh, 2, lY + 4, 3, 2);
  pen(P.kimono, 13, rY, 3, 6);
  pen(P.kimonoSh, 13, rY + 4, 3, 2);

  // Obi sash + knot.
  pen(P.obi, 4, 15, 10, 2);
  pen(P.accent, 8, 15, 2, 2);

  // White under-collar (V neck).
  pen(P.white, 6, 11, 2, 3);
  pen(P.white, 11, 11, 2, 3);
  pen(P.white, 7, 13, 4, 1);

  // Neck.
  pen(P.skin, 8, 10, 2, 1);

  // Head.
  pen(P.skin, 6, 2, 6, 1);
  pen(P.skin, 5, 3, 8, 6);
  pen(P.skin, 6, 9, 6, 1);
  pen(P.skinSh, 12, 3, 1, 6);

  drawHair(pen, P, kind);
}

function drawHair(pen: Pen, P: CharPalette, kind: CharKind): void {
  switch (kind) {
    case "player":
      pen(P.hair, 5, 1, 8, 2);
      pen(P.hair, 5, 3, 1, 4);
      pen(P.hair, 12, 3, 1, 4);
      pen(P.hair, 4, 1, 1, 2);
      pen(P.hair, 13, 1, 1, 2);
      // tenugui headband
      pen(P.white, 4, 3, 10, 1);
      pen(P.white, 3, 3, 2, 2);
      pen(P.white, 2, 5, 1, 2);
      break;
    case "landlord":
      // shaved-front chonmage — reads as an older man
      pen(P.hair, 7, 0, 4, 2);
      pen(P.hair, 8, 1, 2, 1);
      pen(P.hair, 5, 1, 8, 1);
      pen(P.hair, 5, 2, 1, 6);
      pen(P.hair, 12, 2, 1, 6);
      pen(P.hair, 8, 8, 2, 1);
      pen(P.hair, 7, 9, 4, 1);
      break;
    case "fishmonger":
      pen(P.hair, 5, 1, 8, 2);
      pen(P.hair, 5, 3, 1, 3);
      pen(P.hair, 12, 3, 1, 3);
      // hachimaki headband
      pen(P.accent, 4, 3, 10, 1);
      pen(P.accent, 12, 3, 2, 2);
      pen(P.accent, 13, 4, 1, 3);
      break;
    case "child":
      pen(P.hair, 5, 1, 8, 2);
      pen(P.hair, 4, 1, 1, 3);
      pen(P.hair, 13, 1, 1, 3);
      pen(P.hair, 8, 0, 2, 1);
      break;
    case "newsman":
      pen(P.hair, 5, 1, 8, 2);
      pen(P.hair, 5, 3, 1, 5);
      pen(P.hair, 12, 3, 1, 5);
      pen(P.hair, 8, 0, 2, 1);
      break;
  }
}

/** Face features — colour pass only (no hard outline). */
function drawFace(pen: Pen, P: CharPalette, kind: CharKind): void {
  if (kind === "child") {
    pen(P.eye, 6, 5, 2, 3);
    pen(P.eye, 10, 5, 2, 3);
    pen(P.white, 6, 5, 1, 1);
    pen(P.white, 10, 5, 1, 1);
    pen(P.blush, 4, 8, 2, 1);
    pen(P.blush, 12, 8, 2, 1);
    pen(P.skinSh, 8, 9, 2, 1);
    return;
  }

  pen(P.eye, 6, 5, 2, 2);
  pen(P.eye, 10, 5, 2, 2);
  pen(P.white, 6, 5, 1, 1);
  pen(P.white, 10, 5, 1, 1);
  pen(P.blush, 5, 7, 1, 1);
  pen(P.blush, 12, 7, 1, 1);
  pen(P.skinSh, 8, 8, 2, 1);

  if (kind === "landlord") {
    pen(P.hair, 6, 4, 2, 1);
    pen(P.hair, 10, 4, 2, 1);
  }
}

/** Held props — colour pass only. */
function drawProp(pen: Pen, P: CharPalette, kind: CharKind): void {
  if (kind === "fishmonger") {
    pen(FISH_SILVER, 1, 14, 4, 2);
    pen(FISH_SILVER, 0, 13, 1, 1);
    pen(FISH_SILVER, 0, 16, 1, 1);
    pen(P.eye, 4, 14, 1, 1);
  } else if (kind === "newsman") {
    pen(P.white, 5, 14, 8, 5);
    pen(P.kimonoSh, 5, 15, 8, 1);
    pen(P.kimonoSh, 5, 17, 8, 1);
  }
}

function drawChibi(
  g: Phaser.GameObjects.Graphics,
  P: CharPalette,
  kind: CharKind,
  frame: number
): void {
  const outlinePen: Pen = (_color, x, y, w, h) => {
    g.fillStyle(P.outline, 1);
    g.fillRect(x * CELL - 1, y * CELL - 1, w * CELL + 2, h * CELL + 2);
  };
  const colorPen: Pen = (color, x, y, w, h) => {
    g.fillStyle(color, 1);
    g.fillRect(x * CELL, y * CELL, w * CELL, h * CELL);
  };

  drawBody(outlinePen, P, kind, frame);
  drawBody(colorPen, P, kind, frame);
  drawFace(colorPen, P, kind);
  drawProp(colorPen, P, kind);
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
];

/** Generates every character texture into the scene's texture manager. */
export function buildCharacterTextures(scene: Phaser.Scene): void {
  for (const spec of TEXTURE_SPECS) {
    if (scene.textures.exists(spec.key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 });
    drawChibi(g, PALETTES[spec.kind], spec.kind, spec.frame);
    g.generateTexture(spec.key, CHAR_TEX_W, CHAR_TEX_H);
    g.destroy();
  }
}
