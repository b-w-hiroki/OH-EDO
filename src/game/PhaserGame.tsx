import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { TownScene } from "./TownScene";
import { GAME_HEIGHT, GAME_WIDTH } from "./worldConfig";

/**
 * Mounts the Phaser town once and keeps it alive for the whole play session.
 * React overlays (dialog / job / status) render on top of this canvas.
 */
export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: "#16110d",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [TownScene],
    });
    gameRef.current = game;

    // Dev-only debug handle (stripped from production builds).
    if (import.meta.env.DEV) {
      (window as unknown as { __ohedoGame?: Phaser.Game }).__ohedoGame = game;
    }

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="phaser-container" />;
}
