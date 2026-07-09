import { System } from '../engine/Game';
import { World } from '../engine/ecs';
import * as THREE from 'three';

export class CombatSystem implements System {
  private world!: World;

  start(){
    // @ts-ignore
    const game = window.__GAME__;
    this.world = game.world;
  }

  update(dt:number){
    const players = this.world.query('Transform','Player');
    if (players.length===0) return;
    const player = players[0].entity;
    const pT = this.world.getComponent(player, 'Transform') as any;
    const attacking = false;
    if (!attacking) return;

    const enemies = this.world.query('Transform','Health');
    for (const e of enemies) {
      const ent = e.entity;
      const t = this.world.getComponent(ent,'Transform') as any;
      const h = this.world.getComponent(ent,'Health') as any;
      const dist = new THREE.Vector3().subVectors(t.position, pT.position).length();
      if (dist < 1.8) {
        h.hp -= 8;
        if (h.hp <= 0) {
          this.world.removeEntity(ent);
          const model = this.world.getComponent(ent,'Model');
          if (model) model.mesh.parent?.remove(model.mesh);
        }
      }
    }
  }
}
