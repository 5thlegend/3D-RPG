import { System } from '../engine/Game';
import { World } from '../engine/ecs';
import * as CANNON from 'cannon-es';
import { Transform } from '../components/Transform';

type RigidBodyDef = { mass: number; shape: CANNON.Shape; body?: CANNON.Body; entity?: number };

export class PhysicsSystem implements System {
  private world!: World;
  private phys!: CANNON.World;
  private bodies = new Map<number, RigidBodyDef>();

  start() {
    // @ts-ignore
    const game = window.__GAME__;
    this.world = game.world;
    this.phys = new CANNON.World();
    this.phys.gravity.set(0, -9.82, 0);
    this.phys.broadphase = new CANNON.SAPBroadphase(this.phys);
    // static ground plane
    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
    this.phys.addBody(groundBody);
  }

  registerBody(entity: number, transform: Transform, mass: number, shape: CANNON.Shape) {
    const body = new CANNON.Body({ mass, shape });
    body.position.set(transform.position.x, transform.position.y, transform.position.z);
    this.phys.addBody(body);
    this.bodies.set(entity, { mass, shape, body, entity });
    return body;
  }

  fixedUpdate(dt: number) {
    this.phys.step(dt);
    for (const [entity, def] of this.bodies.entries()) {
      const t = this.world.getComponent<Transform>(entity, 'Transform');
      if (!t || !def.body) continue;
      t.position.set(def.body.position.x, def.body.position.y, def.body.position.z);
      const model = this.world.getComponent(entity, 'Model');
      if (model) model.mesh.position.copy(t.position);
    }
  }

  update(dt:number) {}
}
