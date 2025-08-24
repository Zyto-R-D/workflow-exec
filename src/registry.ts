import { ActionDef } from './types';

export class ActionRegistry {
  private map = new Map<string, ActionDef>();

  register(def: ActionDef) {
    if (this.map.has(def.type)) throw new Error(`Action type already registered: ${def.type}`);
    this.map.set(def.type, def);
  }

  get(type: string): ActionDef | undefined {
    return this.map.get(type);
  }

  list(): string[] {
    return [...this.map.keys()];
  }
}
