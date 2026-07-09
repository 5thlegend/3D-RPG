import { System } from '../engine/Game';
import { createTransform } from '../components/Transform';
import { RenderSystem } from './RenderSystem';

export class PlayerControlSystem implements System {
  private input = { left:false, right:false, forward:false, back:false };
  private playerEntity: number | null = null;
  private world: any;
  private scene: any;
  private camera: any;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA') this.input.left = true;
      if (e.code === 'KeyD') this.input.right = true;
      if (e.code === 'KeyW') this.input.forward = true;
      if (e.code === 'KeyS') this.input.back = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA') this.input.left = false;
      if (e.code === 'KeyD') this.input.right = false;
      if (e.code === 'KeyW') this.input.forward = false;
      if (e.code === 'KeyS') this.input.back = false;
    });
  }

  start() {
    // @ts-ignore
    const game = window.__GAME__;
    this.world = game.world;
    this.scene = game.scene;
    this.camera = game.camera;

    const THREE = require('three');
    const geo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2fbf7f });
    const mesh = new THREE.Mesh(geo, mat);
    const transform = createTransform(0, 1, 0);
    this.playerEntity = RenderSystem.attachModel(this.world, this.scene, transform, mesh);
    this.world.addComponent(this.playerEntity, 'Player', true);

    // mark camera initial
    this.camera.position.set(transform.position.x + 6, transform.position.y + 6, transform.position.z + 8);
    this.camera.lookAt(transform.position.x, transform.position.y, transform.position.z);
  }

  update(dt:number) {
    if (!this.playerEntity) return;
    const t = this.world.getComponent(this.playerEntity, 'Transform');
    const speed = 4;
    const dir = { x:0, z:0 };
    if (this.input.left) dir.x -= 1;
    if (this.input.right) dir.x += 1;
    if (this.input.forward) dir.z -= 1;
    if (this.input.back) dir.z += 1;
    const len = Math.hypot(dir.x, dir.z);
    if (len > 0) {
      dir.x /= len; dir.z /= len;
      t.position.x += dir.x * speed * dt;
      t.position.z += dir.z * speed * dt;
      const model = this.world.getComponent(this.playerEntity, 'Model');
      if (model) model.mesh.position.copy(t.position);

      const camPos = { x: t.position.x + 6, y: t.position.y + 6, z: t.position.z + 8 };
      this.camera.position.x += (camPos.x - this.camera.position.x) * 0.08;
      this.camera.position.y += (camPos.y - this.camera.position.y) * 0.08;
      this.camera.position.z += (camPos.z - this.camera.position.z) * 0.08;
      this.camera.lookAt(t.position.x, t.position.y, t.position.z);
    }
  }
}
