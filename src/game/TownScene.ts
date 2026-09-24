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

  preload(): void {
    this.load.image("bg-market-art", "/assets/edo/backgrounds/market.webp");
    this.load.image("bg-nagaya-art", "/assets/edo/backgrounds/nagaya.webp");
    this.load.image("bg-well-art", "/assets/edo/backgrounds/well.webp");
    this.load.image("bg-firehouse-art", "/assets/edo/backgrounds/firehouse.webp");
  }

  create(): void {
    this.makeTextures();
    this.drawGround();
    this.drawArtBackgrounds();
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

    // Keep the procedural decoration data available for collisions/layout,
    // but let the generated background art carry the visual detail.
  }

  private drawArtBackgrounds(): void {
    const mapping: Array<[OutdoorArea, string]> = [
      ["market", "bg-market-art"],
      ["nagaya", "bg-nagaya-art"],
      ["well", "bg-well-art"],
      ["firehouse", "bg-firehouse-art"],
    ];

    mapping.forEach(([area, key]) => {
      const b = AREA_BOUNDS[area];
      const image = this.add
        .image(b.x + b.w / 2, b.y + b.h / 2, key)
        .setDepth(-18);

      // Generated masters are 16:9. Crop them to the wide playable district
      // while preserving their proportions instead of stretching.
      const source = image.texture.getSourceImage() as HTMLImageElement;
      const cropHeight = Math.max(
        1,
        Math.min(source.height, Math.round(source.width * (b.h / b.w)))
      );
      const cropY = Math.max(0, Math.round((source.height - cropHeight) / 2));
      image.setCrop(0, cropY, source.width, cropHeight);
      image.setDisplaySize(b.w, b.h);

      // A faint wash keeps NPCs and prompts readable over detailed art.
      this.add
        .rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, 0xfffbef, 0.04)
        .setDepth(-17);
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
    // Room door remains an interaction target; background art supplies the building.
    this.add
      .rectangle(
        this.doorCenter.x,
        this.doorCenter.y,
        ROOM_DOOR.w,
        ROOM_DOOR.h,
        0xffffff,
        0.001
      )
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

    // Well collider stays invisible; the generated background contains the well art.
    const well = this.add
      .rectangle(
        WELL_OBSTACLE.x + WELL_OBSTACLE.w / 2,
        WELL_OBSTACLE.y + WELL_OBSTACLE.h / 2,
        WELL_OBSTACLE.w,
        WELL_OBSTACLE.h,
        0xffffff,
        0.001
      )
      .setDepth(-4);
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
      image.setInteractive({ useHandCursor: true });
      image.on("pointerdown", () => {
        if (!this.inputEnabled) return;
        EventBus.emit("npc-interact", id as NPCId);
      });
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
