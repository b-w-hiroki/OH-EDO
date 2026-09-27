type Listener = (...args: any[]) => void;

/**
 * Lightweight singleton event bridge used by the React town UI.
 *
 * This intentionally does not depend on Phaser. Legacy Phaser scene files can
 * still use the same on/off/emit surface if they are re-enabled later, while
 * the production React build avoids shipping the Phaser runtime.
 */
class LightweightEventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): this {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }

  off(event: string, listener: Listener): this {
    const set = this.listeners.get(event);
    if (!set) return this;
    set.delete(listener);
    if (set.size === 0) this.listeners.delete(event);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return false;
    [...set].forEach((listener) => listener(...args));
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
    return this;
  }
}

export const EventBus = new LightweightEventBus();
