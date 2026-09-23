import Phaser from "phaser";
import { EventBus } from "./EventBus";
import { NPCS } from "../data";
import type { AreaId, NPCId, Screen } from "../types";
import {
  AREA_BOUNDS,
  AREA_GROUND,
  AREA_LABEL,
  DECORATIONS,
  NPC_SPAWNS,
  PLAYER_SPAWN,
  ROOM_DOOR,
  WELL_OBSTACLE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type OutdoorArea,
  type Vec,
  type WorldNPC,
} from "./worldConfig";
import { CHAR_SCALE, CHAR_TEX_H, buildCharacterTextures } from "./characters";

const PLAYER_SPEED = 196;
const INTERACT_RANGE = 84;
const DOOR_PAD = 30;

type KeyMap = Record<string, Phaser.Input.Keyboard.Key>;

interface NPCEntity {
  id: WorldNPC;
  image: Phaser.GameObjects.Image;
}

function rectContainsExpanded(
  r: { x: number; y: number; w: number; h: number },
  px: number,
  py: number,
  pad: number
): boolean {
  return (
    px >= r.x - pad &&
    px <= r.x + r.w + pad &&
    py >= r.y - pad &&
    py <= r.y + r.h + pad
  );
}

export class TownScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private keys: KeyMap | null = null;
  private npcEntities: NPCEntity[] = [];
  private promptText!: Phaser.GameObjects.Text;

  private currentArea: OutdoorArea = "nagaya";
  private inputEnabled = true;
  private roomUnlocked = false;
  private nearbyNPC: WorldNPC | null = null;
  private nearDoor = false;
  private walkTimer = 0;
  private walkFrame = 0;
  private virtualMove: Vec = { x: 0, y: 0 };
  private virtualActionQueued = false;
  private firehouseUnlocked = false;
  private firehouseGateBody: Phaser.Physics.Arcade.StaticBody | null = null;

  private readonly doorCenter: Vec = {
    x: ROOM_DOOR.x + ROOM_DOOR.w / 2,
    y: ROOM_DOOR.y + ROOM_DOOR.h / 2,
  };

  constructor() {
    super("TownScene");
  }

  create(): void {
    this.makeTextures();
    this.drawGround();
    this.drawDistantBackdrop();
    this.drawAreaAtmosphere();
    this.createPlayer();
    this.createObstacles();
    this.createNPCs();
    this.setupCamera();
    this.setupInput();

    this.promptText = this.add
      .text(0, 0, "", {
        fontFamily: "sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#4f4337",
        backgroundColor: "#fff7e8",
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5, 1)
      .setDepth(2000)
      .setVisible(false);

    EventBus.on("screen-changed", this.onScreenChanged);
    EventBus.on("game-flags", this.onGameFlags);
    EventBus.on("warp", this.onWarp);
    EventBus.on("virtual-move", this.onVirtualMove);
    EventBus.on("virtual-action", this.onVirtualAction);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

    EventBus.emit("scene-ready");
  }

  // ── Setup ─────────────────────────────────────────────

  private makeTextures(): void {
    buildCharacterTextures(this);
  }

  private drawGround(): void {
    (Object.keys(AREA_BOUNDS) as OutdoorArea[]).forEach((area) => {
      const b = AREA_BOUNDS[area];
      this.add
        .rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w - 8, b.h - 8, AREA_GROUND[area])
        .setStrokeStyle(3, 0xc89d65)
        .setDepth(-20);
      this.add
        .text(b.x + b.w / 2, b.y + 30, AREA_LABEL[area], {
          fontFamily: "serif",
          fontSize: "44px",
          color: "#6f8ea3",
        })
        .setOrigin(0.5, 0)
        .setAlpha(0.32)
        .setDepth(-19);
    });

    DECORATIONS.forEach(([x, y, w, h, color]) => {
      this.add
        .rectangle(x, y, w, h, color)
        .setStrokeStyle(2, 0xb8895d)
        .setDepth(-10);
    });
  }

  private drawDistantBackdrop(): void {
    const g = this.add.graphics().setDepth(-18);

    const areaTops = [
      AREA_BOUNDS.market.y,
      AREA_BOUNDS.nagaya.y,
      AREA_BOUNDS.well.y,
      AREA_BOUNDS.firehouse.y,
    ];

    areaTops.forEach((top, index) => {
      // pale sky band
      g.fillStyle(index === 2 ? 0xcfe9e5 : 0xbfe5fa, 0.9);
      g.fillRect(0, top, WORLD_WIDTH, 110);

      // distant roofs to avoid the flat "boxed map" look
      const roofY = top + 86;
      for (let x = -40; x < WORLD_WIDTH + 80; x += 150) {
        const offset = (x / 150) % 2 === 0 ? 0 : 12;
        g.fillStyle(index % 2 === 0 ? 0x8596a1 : 0x8c897e, 0.22);
        g.fillTriangle(x, roofY + offset, x + 68, roofY - 28 + offset, x + 138, roofY + offset);
        g.fillStyle(0xc3aa84, 0.16);
        g.fillRect(x + 13, roofY + offset, 112, 34);
      }

      // soft cloud puffs
      g.fillStyle(0xffffff, 0.38);
      g.fillEllipse(170, top + 46, 140, 34);
      g.fillEllipse(240, top + 36, 96, 28);
      g.fillEllipse(1010, top + 52, 150, 38);
      g.fillEllipse(1080, top + 40, 86, 26);
    });
  }

  private drawAreaAtmosphere(): void {
    const g = this.add.graphics().setDepth(-15);

    // A pale walkable street running through every district, with soft
    // perspective edges so it reads more like an illustrated town street.
    g.fillStyle(0xf2dfb7, 1);
    g.fillRoundedRect(465, 0, 350, WORLD_HEIGHT, 34);
    g.fillStyle(0xe2c696, 0.45);
    g.fillTriangle(465, 0, 500, WORLD_HEIGHT, 535, 0);
    g.fillTriangle(815, 0, 780, WORLD_HEIGHT, 745, 0);
    g.lineStyle(2, 0xcaa977, 0.34);
    g.lineBetween(494, 0, 526, WORLD_HEIGHT);
    g.lineBetween(786, 0, 754, WORLD_HEIGHT);

    // Side building facades create the "street framed by Edo houses" look.
    const drawHouse = (
      x: number,
      y: number,
      w: number,
      h: number,
      wall: number,
      roof: number
    ) => {
      g.fillStyle(wall, 1);
      g.fillRoundedRect(x, y, w, h, 10);
      g.fillStyle(roof, 1);
      g.fillRect(x - 8, y - 10, w + 16, 18);
      g.fillStyle(0x73533c, 1);
      for (let px = x + 18; px < x + w - 12; px += 42) {
        g.fillRect(px, y + 24, 5, h - 30);
      }
      g.fillStyle(0xe8d2a4, 0.9);
      g.fillRect(x + 12, y + 34, w - 24, 7);
    };

    // 商店通り
    drawHouse(30, 72, 250, 236, 0xd59e69, 0x6f5260);
    drawHouse(950, 74, 290, 238, 0xd8a66f, 0x526b7f);
    // shop awnings / noren
    g.fillStyle(0x527fa2, 0.95);
    g.fillRoundedRect(260, 118, 168, 34, 6);
    g.fillStyle(0xe56f59, 0.95);
    g.fillRoundedRect(842, 126, 152, 32, 6);
    for (let x = 270; x < 420; x += 36) {
      g.fillStyle(0xf8e8c7, 0.78);
      g.fillRect(x, 145, 24, 26);
    }
    for (let x = 850; x < 980; x += 34) {
      g.fillStyle(0xf8e8c7, 0.78);
      g.fillRect(x, 151, 22, 24);
    }
    g.fillStyle(0x376f9b, 1);
    g.fillRoundedRect(54, 150, 88, 108, 5);
    g.fillRoundedRect(1094, 148, 92, 112, 5);
    this.add
      .text(98, 170, "魚", {
        fontFamily: "serif",
        fontSize: "48px",
        color: "#fff8e9",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(-14);
    // lantern row
    for (let i = 0; i < 5; i++) {
      const lx = 485 + i * 78;
      g.lineStyle(2, 0x80634a, 0.7);
      g.lineBetween(lx, 250, lx, 268);
      g.fillStyle(0xe7785f, 0.95);
      g.fillEllipse(lx, 279, 24, 32);
    }

    // 長屋前
    drawHouse(32, 510, 330, 250, 0xc99668, 0x76604e);
    drawHouse(910, 520, 330, 240, 0xd0a06d, 0x6a5961);
    // eaves and small lived-in details
    g.fillStyle(0x6e5948, 0.9);
    g.fillRect(32, 622, 330, 8);
    g.fillRect(910, 632, 330, 8);
    [80, 138, 196, 254].forEach((x) => {
      g.fillStyle(0x8f6a4a, 1);
      g.fillRoundedRect(x, 680, 30, 20, 4);
    });
    // laundry line
    g.lineStyle(3, 0x755a44, 0.7);
    g.lineBetween(94, 720, 338, 720);
    [128, 184, 240, 296].forEach((x, i) => {
      g.fillStyle([0x668bb0, 0xf1d7aa, 0x9fb780, 0xd1776b][i], 0.95);
      g.fillRoundedRect(x, 720, 38, 52, 4);
    });
    // potted plants / buckets
    [920, 972, 1024].forEach((x, i) => {
      g.fillStyle(0x8a6244, 1);
      g.fillRoundedRect(x, 736 + i * 3, 28, 22, 5);
      g.fillStyle(0x73965e, 1);
      g.fillEllipse(x + 14, 728 + i * 3, 26, 20);
    });

    // 井戸端
    // willow-like trees and washing area
    [132, 1120].forEach((x) => {
      g.fillStyle(0x795b3f, 1);
      g.fillRoundedRect(x, 930, 18, 150, 8);
      g.fillStyle(0x88ad68, 0.9);
      g.fillEllipse(x + 8, 936, 118, 72);
      g.fillStyle(0x9dc47b, 0.7);
      g.fillEllipse(x - 10, 975, 94, 66);
    });
    // stepping stones
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0xd6c39e, 0.9);
      g.fillEllipse(530 + i * 44, 1160 + (i % 2) * 12, 38, 20);
    }

    // 火消し小屋
    drawHouse(36, 1392, 350, 260, 0xbd835c, 0x4e6477);
    drawHouse(900, 1392, 340, 260, 0xc58b61, 0x536a7d);
    g.fillStyle(0x3d6079, 0.95);
    g.fillRoundedRect(340, 1412, 118, 32, 6);
    g.fillRoundedRect(820, 1418, 104, 30, 6);
    g.fillStyle(0xf6e3bd, 0.88);
    g.fillRect(352, 1440, 24, 34);
    g.fillRect(388, 1440, 24, 34);
    g.fillRect(834, 1446, 24, 32);
    g.fillRect(870, 1446, 24, 32);
    // matoi pole + buckets
    g.lineStyle(6, 0x6c4b38, 1);
    g.lineBetween(250, 1450, 250, 1640);
    g.fillStyle(0xe5bf58, 1);
    g.fillTriangle(250, 1424, 220, 1460, 280, 1460);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0x9b6f4e, 1);
      g.fillRoundedRect(938 + i * 48, 1580, 34, 30, 6);
      g.lineStyle(2, 0x6e4d37, 0.7);
      g.strokeRoundedRect(938 + i * 48, 1580, 34, 30, 6);
    }

    // Background townspeople and props keep the town lively without becoming noisy.
    const people = [
      [545, 182], [704, 214], [594, 648], [724, 816],
      [606, 1034], [696, 1210], [562, 1488], [756, 1636],
      [500, 356], [778, 370], [540, 862], [742, 1270],
    ];
    people.forEach(([x, y], i) => {
      g.fillStyle(i % 3 === 0 ? 0xc06f62 : i % 2 ? 0x6e7c71 : 0x77889b, 0.38);
      g.fillEllipse(x, y, 20, 22);
      g.fillRoundedRect(x - 11, y + 9, 22, 34, 8);
      if (i % 4 === 0) {
        g.lineStyle(2, 0x72553f, 0.35);
        g.lineBetween(x + 14, y + 14, x + 30, y + 45);
      }
    });

    // Crates, baskets and buckets at street edges.
    const props = [
      [442, 250], [828, 320], [430, 692], [840, 770],
      [438, 1080], [828, 1190], [430, 1510], [842, 1600],
    ];
    props.forEach(([x, y], i) => {
      g.fillStyle(i % 2 ? 0x9f7650 : 0xb58a5f, 0.8);
      g.fillRoundedRect(x, y, 34, 24, 5);
      g.lineStyle(2, 0x73543d, 0.4);
      g.lineBetween(x + 5, y + 7, x + 29, y + 7);
      g.lineBetween(x + 5, y + 15, x + 29, y + 15);
    });
  }

  private createPlayer(): void {
    this.playerShadow = this.add
      .ellipse(PLAYER_SPAWN.x, PLAYER_SPAWN.y + 52, 48, 14, 0x000000, 0.18);
    this.player = this.physics.add.sprite(
      PLAYER_SPAWN.x,
      PLAYER_SPAWN.y,
      "char-player"
    );
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 16);
    body.setOffset(38, 112);
    this.currentArea = this.areaAt(this.player.y);
  }

  private createObstacles(): void {
    // Room door — a building with a dark door panel.
    this.add
      .rectangle(
        this.doorCenter.x,
        this.doorCenter.y,
        ROOM_DOOR.w,
        ROOM_DOOR.h,
        0xd2a474
      )
      .setStrokeStyle(3, 0xb8895d)
      .setDepth(-5);
    this.add
      .rectangle(this.doorCenter.x, this.doorCenter.y + 22, 46, 74, 0x855f42)
      .setDepth(-4);
    this.add
      .text(this.doorCenter.x, ROOM_DOOR.y - 6, "長屋の部屋", {
        fontFamily: "sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#5a4738",
        backgroundColor: "#fff8ea",
        padding: { x: 7, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1500);

    // Well — a solid collider.
    const well = this.add
      .rectangle(
        WELL_OBSTACLE.x + WELL_OBSTACLE.w / 2,
        WELL_OBSTACLE.y + WELL_OBSTACLE.h / 2,
        WELL_OBSTACLE.w,
        WELL_OBSTACLE.h,
        0xb29b83
      )
      .setStrokeStyle(3, 0x9b8067)
      .setDepth(-6);
    this.add
      .ellipse(
        WELL_OBSTACLE.x + WELL_OBSTACLE.w / 2,
        WELL_OBSTACLE.y + WELL_OBSTACLE.h / 2,
        WELL_OBSTACLE.w * 0.58,
        WELL_OBSTACLE.h * 0.5,
        0x73afc4
      )
      .setDepth(-5);
    this.physics.add.existing(well, true);
    this.physics.add.collider(this.player, well);

    // Firehouse access gate. The district is unlocked after the first fire event.
    const gate = this.add
      .rectangle(WORLD_WIDTH / 2, AREA_BOUNDS.firehouse.y + 8, WORLD_WIDTH, 16, 0x000000, 0)
      .setDepth(-2);
    this.physics.add.existing(gate, true);
    this.firehouseGateBody = gate.body as Phaser.Physics.Arcade.StaticBody;
    this.physics.add.collider(this.player, gate);
  }

  private createNPCs(): void {
    (Object.keys(NPC_SPAWNS) as WorldNPC[]).forEach((id) => {
      const pos = NPC_SPAWNS[id];
      const scale = CHAR_SCALE[id];
      const halfH = (CHAR_TEX_H * scale) / 2;

      this.add
        .ellipse(pos.x, pos.y + halfH - 5, 44 * scale, 13 * scale, 0x000000, 0.16)
        .setDepth(pos.y - 1);

      const image = this.add.image(pos.x, pos.y, `char-${id}`);
      image.setScale(scale);
      image.setDepth(pos.y);
      this.tweens.add({
        targets: image,
        scaleY: scale * 1.035,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.add
        .text(pos.x, pos.y - halfH - 6, NPCS[id].name, {
          fontFamily: "sans-serif",
          fontSize: "15px",
          fontStyle: "bold",
          color: "#5a4738",
          backgroundColor: "#fff8ea",
          padding: { x: 7, y: 3 },
        })
        .setOrigin(0.5, 1)
        .setDepth(1500);
      this.npcEntities.push({ id, image });
    });
  }

  private setupCamera(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      up: KC.UP,
      down: KC.DOWN,
      left: KC.LEFT,
      right: KC.RIGHT,
      w: KC.W,
      a: KC.A,
      s: KC.S,
      d: KC.D,
      space: KC.SPACE,
      e: KC.E,
    }) as KeyMap;
  }

  // ── Per-frame ─────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.player || !this.keys) return;

    if (!this.inputEnabled) {
      this.player.setVelocity(0, 0);
      this.promptText.setVisible(false);
      if (this.walkFrame !== 0) {
        this.walkFrame = 0;
        this.player.setTexture("char-player");
      }
      this.syncPlayerDepth();
      return;
    }

    this.handleMovement(delta);
    this.handleAreaDetection();
    this.handleProximity();
    this.handleAction();
    this.syncPlayerDepth();
  }

  private syncPlayerDepth(): void {
    this.player.setDepth(this.player.y);
    this.playerShadow.setPosition(this.player.x, this.player.y + 52);
    this.playerShadow.setDepth(this.player.y - 1);
  }

  private handleMovement(delta: number): void {
    const k = this.keys!;
    let vx = 0;
    let vy = 0;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;
    vx += this.virtualMove.x;
    vy += this.virtualMove.y;

    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(PLAYER_SPEED);
    this.player.setVelocity(v.x, v.y);
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // Two-frame walk cycle.
    if (vx !== 0 || vy !== 0) {
      this.walkTimer += delta;
      if (this.walkTimer > 150) {
        this.walkTimer = 0;
        this.walkFrame = this.walkFrame === 0 ? 1 : 0;
        this.player.setTexture(
          this.walkFrame === 1 ? "char-player-b" : "char-player"
        );
      }
    } else if (this.walkFrame !== 0) {
      this.walkFrame = 0;
      this.walkTimer = 0;
      this.player.setTexture("char-player");
    }
  }

  private handleAreaDetection(): void {
    const area = this.areaAt(this.player.y);
    if (area !== this.currentArea) {
      this.currentArea = area;
      EventBus.emit("area-entered", area);
    }
  }

  private handleProximity(): void {
    const px = this.player.x;
    const py = this.player.y;

    let best: WorldNPC | null = null;
    let bestDist = INTERACT_RANGE;
    for (const e of this.npcEntities) {
      const d = Phaser.Math.Distance.Between(px, py, e.image.x, e.image.y);
      if (d < bestDist) {
        bestDist = d;
        best = e.id;
      }
    }
    this.nearbyNPC = best;
    this.nearDoor = rectContainsExpanded(ROOM_DOOR, px, py, DOOR_PAD);

    if (best) {
      const e = this.npcEntities.find((n) => n.id === best)!;
      this.showPrompt(e.image.x, e.image.y - 72, "話す");
    } else if (this.nearDoor) {
      this.showPrompt(
        this.doorCenter.x,
        ROOM_DOOR.y - 26,
        this.roomUnlocked ? "スペース：部屋に入る" : "ここはまだ入れない"
      );
    } else {
      this.promptText.setVisible(false);
    }
  }

  private handleAction(): void {
    const k = this.keys!;
    const pressed =
      Phaser.Input.Keyboard.JustDown(k.space) ||
      Phaser.Input.Keyboard.JustDown(k.e) ||
      this.virtualActionQueued;
    this.virtualActionQueued = false;
    if (!pressed) return;

    if (this.nearbyNPC) {
      EventBus.emit("npc-interact", this.nearbyNPC as NPCId);
    } else if (this.nearDoor && this.roomUnlocked) {
      EventBus.emit("enter-room");
    }
  }

  private showPrompt(x: number, y: number, text: string): void {
    this.promptText.setText(text);
    this.promptText.setPosition(x, y);
    this.promptText.setVisible(true);
  }

  private areaAt(y: number): OutdoorArea {
    if (y < AREA_BOUNDS.market.y + AREA_BOUNDS.market.h) return "market";
    if (y < AREA_BOUNDS.nagaya.y + AREA_BOUNDS.nagaya.h) return "nagaya";
    if (y < AREA_BOUNDS.well.y + AREA_BOUNDS.well.h) return "well";
    return "firehouse";
  }

  // ── Bridge handlers ───────────────────────────────────

  private onScreenChanged = (screen: Screen): void => {
    this.inputEnabled = screen === "town";
  };

  private onGameFlags = (flags: {
    roomUnlocked: boolean;
    firehouseUnlocked?: boolean;
  }): void => {
    this.roomUnlocked = flags.roomUnlocked;
    this.firehouseUnlocked = Boolean(flags.firehouseUnlocked);
    if (this.firehouseGateBody) {
      this.firehouseGateBody.enable = !this.firehouseUnlocked;
    }
  };

  private onWarp = (area: AreaId): void => {
    const target: Vec =
      area === "market"
        ? { x: 640, y: 250 }
        : area === "well"
          ? { x: 660, y: 1080 }
          : area === "firehouse"
            ? { x: 650, y: 1490 }
            : { x: PLAYER_SPAWN.x, y: PLAYER_SPAWN.y };
    this.player.setPosition(target.x, target.y);
    this.player.setVelocity(0, 0);
    this.currentArea = this.areaAt(target.y);
  };

  private onVirtualMove = (move: Vec): void => {
    this.virtualMove = {
      x: Phaser.Math.Clamp(move?.x ?? 0, -1, 1),
      y: Phaser.Math.Clamp(move?.y ?? 0, -1, 1),
    };
  };

  private onVirtualAction = (): void => {
    this.virtualActionQueued = true;
  };

  private cleanup = (): void => {
    EventBus.off("screen-changed", this.onScreenChanged);
    EventBus.off("game-flags", this.onGameFlags);
    EventBus.off("warp", this.onWarp);
    EventBus.off("virtual-move", this.onVirtualMove);
    EventBus.off("virtual-action", this.onVirtualAction);
  };
}
