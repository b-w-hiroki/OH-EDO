type Listener = (...args: any[]) => void;

class LightweightEventBus {
  private readonly listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): this {
    const eventListeners = this.listeners.get(event) ?? new Set<Listener>();
    eventListeners.add(listener);
    this.listeners.set(event, eventListeners);
    return this;
  }

  off(event: string, listener: Listener): this {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return this;
    eventListeners.delete(listener);
    if (eventListeners.size === 0) this.listeners.delete(event);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) return false;
    for (const listener of [...eventListeners]) listener(...args);
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
    return this;
  }
}

/**
 * Singleton event bridge between React state and the optional Phaser town scene.
 * Kept dependency-free so the scenic React UI does not pull the full Phaser
 * runtime into the initial production bundle merely for EventEmitter.
 */
export const EventBus = new LightweightEventBus();
