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
  NPC_TINTS,
  PLAYER_SPAWN,
  PLAYER_TINT,
  ROOM_DOOR,
  WELL_OBSTACLE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type OutdoorArea,
  type Vec,
  type WorldNPC,
} from "./worldConfig";

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
  private keys: KeyMap | null = null;
  private npcEntities: NPCEntity[] = [];
  private promptText!: Phaser.GameObjects.Text;

  private currentArea: OutdoorArea = "nagaya";
  private inputEnabled = true;
  private roomUnlocked = false;
  private nearbyNPC: WorldNPC | null = null;
  private nearDoor = false;

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
    this.createPlayer();
    this.createObstacles();
    this.createNPCs();
    this.setupCamera();
    this.setupInput();

    this.promptText = this.add
      .text(0, 0, "", {
        fontFamily: "sans-serif",
        fontSize: "15px",
        color: "#fff4dc",
        backgroundColor: "#3a1f0fdd",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(2000)
      .setVisible(false);

    EventBus.on("screen-changed", this.onScreenChanged);
    EventBus.on("game-flags", this.onGameFlags);
    EventBus.on("warp", this.onWarp);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

    EventBus.emit("scene-ready");
  }

  // ── Setup ─────────────────────────────────────────────

  private makeTextures(): void {
    if (this.textures.exists("figure")) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(6, 16, 18, 22, 5); // body
    g.fillCircle(15, 11, 9); // head
    g.lineStyle(3, 0x241a12, 1);
    g.strokeRoundedRect(6, 16, 18, 22, 5);
    g.strokeCircle(15, 11, 9);
    g.generateTexture("figure", 30, 40);
    g.destroy();
  }

  private drawGround(): void {
    (Object.keys(AREA_BOUNDS) as OutdoorArea[]).forEach((area) => {
      const b = AREA_BOUNDS[area];
      this.add
        .rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w - 8, b.h - 8, AREA_GROUND[area])
        .setStrokeStyle(3, 0x5a4736)
        .setDepth(-20);
      this.add
        .text(b.x + b.w / 2, b.y + 30, AREA_LABEL[area], {
          fontFamily: "serif",
          fontSize: "44px",
          color: "#ffffff",
        })
        .setOrigin(0.5, 0)
        .setAlpha(0.12)
        .setDepth(-19);
    });

    DECORATIONS.forEach(([x, y, w, h, color]) => {
      this.add
        .rectangle(x, y, w, h, color)
        .setStrokeStyle(2, 0x6b5640)
        .setDepth(-10);
    });
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(
      PLAYER_SPAWN.x,
      PLAYER_SPAWN.y,
      "figure"
    );
    this.player.setTint(PLAYER_TINT);
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 14);
    body.setOffset(5, 24);
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
        0x4a3a2c
      )
      .setStrokeStyle(3, 0x6b5640)
      .setDepth(-5);
    this.add
      .rectangle(this.doorCenter.x, this.doorCenter.y + 22, 46, 74, 0x241a12)
      .setDepth(-4);
    this.add
      .text(this.doorCenter.x, ROOM_DOOR.y - 6, "長屋の部屋", {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#f4e8d6",
        backgroundColor: "#241a12cc",
        padding: { x: 6, y: 2 },
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
        0x5a5048
      )
      .setStrokeStyle(3, 0x7a6c5a)
      .setDepth(-6);
    this.add
      .ellipse(
        WELL_OBSTACLE.x + WELL_OBSTACLE.w / 2,
        WELL_OBSTACLE.y + WELL_OBSTACLE.h / 2,
        WELL_OBSTACLE.w * 0.58,
        WELL_OBSTACLE.h * 0.5,
        0x27424f
      )
      .setDepth(-5);
    this.physics.add.existing(well, true);
    this.physics.add.collider(this.player, well);
  }

  private createNPCs(): void {
    (Object.keys(NPC_SPAWNS) as WorldNPC[]).forEach((id) => {
      const pos = NPC_SPAWNS[id];
      const image = this.add.image(pos.x, pos.y, "figure");
      image.setTint(NPC_TINTS[id]);
      image.setDepth(pos.y);
      this.add
        .text(pos.x, pos.y - 32, NPCS[id].name, {
          fontFamily: "sans-serif",
          fontSize: "14px",
          color: "#f4e8d6",
          backgroundColor: "#241a12cc",
          padding: { x: 6, y: 2 },
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

  update(): void {
    if (!this.player || !this.keys) return;

    if (!this.inputEnabled) {
      this.player.setVelocity(0, 0);
      this.promptText.setVisible(false);
      return;
    }

    this.handleMovement();
    this.handleAreaDetection();
    this.handleProximity();
    this.handleAction();
    this.player.setDepth(this.player.y);
  }

  private handleMovement(): void {
    const k = this.keys!;
    let vx = 0;
    let vy = 0;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;

    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(PLAYER_SPEED);
    this.player.setVelocity(v.x, v.y);
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);
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
      this.showPrompt(e.image.x, e.image.y - 50, "スペース：はなしかける");
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
      Phaser.Input.Keyboard.JustDown(k.e);
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
    return "well";
  }

  // ── Bridge handlers ───────────────────────────────────

  private onScreenChanged = (screen: Screen): void => {
    this.inputEnabled = screen === "town";
  };

  private onGameFlags = (flags: { roomUnlocked: boolean }): void => {
    this.roomUnlocked = flags.roomUnlocked;
  };

  private onWarp = (area: AreaId): void => {
    const target: Vec =
      area === "market"
        ? { x: 640, y: 250 }
        : area === "well"
          ? { x: 660, y: 1080 }
          : { x: PLAYER_SPAWN.x, y: PLAYER_SPAWN.y };
    this.player.setPosition(target.x, target.y);
    this.player.setVelocity(0, 0);
    this.currentArea = this.areaAt(target.y);
  };

  private cleanup = (): void => {
    EventBus.off("screen-changed", this.onScreenChanged);
    EventBus.off("game-flags", this.onGameFlags);
    EventBus.off("warp", this.onWarp);
  };
}
