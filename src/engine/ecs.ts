export type Entity = number;

export class World {
  private nextEntity = 1;
  private components = new Map<string, Map<Entity, any>>();

  createEntity(): Entity {
    return this.nextEntity++;
  }

  addComponent<T>(entity: Entity, name: string, data: T) {
    let map = this.components.get(name);
    if (!map) { map = new Map(); this.components.set(name, map); }
    map.set(entity, data);
  }

  getComponent<T>(entity: Entity, name: string): T | undefined {
    return this.components.get(name)?.get(entity);
  }

  removeEntity(entity: Entity) {
    for (const map of this.components.values()) map.delete(entity);
  }

  query(...names: string[]): { entity: Entity; components: any[] }[] {
    if (names.length === 0) return [];
    const first = this.components.get(names[0]);
    if (!first) return [];
    const results: { entity: Entity; components: any[] }[] = [];
    for (const [entity] of first.entries()) {
      let ok = true;
      const comps = [first.get(entity)];
      for (let i = 1; i < names.length; i++) {
        const map = this.components.get(names[i]);
        if (!map || !map.has(entity)) { ok = false; break; }
        comps.push(map.get(entity));
      }
      if (ok) results.push({ entity, components: comps });
    }
    return results;
  }
}
