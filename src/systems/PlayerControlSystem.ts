import { System } from '../engine/Game';
import { createTransform } from '../components/Transform';
import { RenderSystem } from './RenderSystem';
import * as THREE from 'three';

export class PlayerControlSystem implements System {
  private input = { left:false, right:false, forward:false, back:false };
  private playerEntity: number | null = null;
  private world: any;
  private scene: any;
  private camera: any;
  private modelRoot: THREE.Object3D | null = null;

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

    // create a placeholder transform and entity for the player
    const transform = createTransform(0, 1, 0);
    // create a simple low-poly capsule-shaped mesh as placeholder
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 4, 8), new THREE.MeshStandardMaterial({ color: 0x2fbf7f }));
    body.castShadow = true; body.receiveShadow = true;
    this.playerEntity = RenderSystem.attachModel(this.world, this.scene, transform, body);
    this.world.addComponent(this.playerEntity, 'Player', true);

    // try to replace placeholder with a GLTF character if AnimationSystem exists
    const animSys = (game.systems.find((s:any)=>s.constructor.name==='AnimationSystem')) as any;
    if (animSys) {
      const MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb';
      // load but don't await - swap in when ready
      animSys.loadCharacter(MODEL_URL, this.playerEntity, (root: THREE.Object3D) => {
        // adjust scale & orientation
        root.scale.setScalar(0.025);
        root.position.copy(transform.position as any);
        this.modelRoot = root;
      }).catch((err:any)=>{
        console.warn('Failed to load character glTF:', err);
      });
    }

    // initialize camera position
    this.camera.position.set(transform.position.x + 6, transform.position.y + 4, transform.position.z + 8);
    this.camera.lookAt(transform.position.x, transform.position.y + 1, transform.position.z);
  }

  update(dt:number) {
    if (!this.playerEntity) return;
    const t = this.world.getComponent(this.playerEntity, 'Transform');
    const speed = 4;
    const dir = new THREE.Vector3();
    if (this.input.left) dir.x -= 1;
    if (this.input.right) dir.x += 1;
    if (this.input.forward) dir.z -= 1;
    if (this.input.back) dir.z += 1;
    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed * dt);
      t.position.x += dir.x;
      t.position.z += dir.z;
      const model = this.world.getComponent(this.playerEntity, 'Model');
      if (model) model.mesh.position.copy(t.position);
    }

    // smooth third-person camera with simple collision avoidance
    const desired = new THREE.Vector3(t.position.x + 6, t.position.y + 4, t.position.z + 8);
    // raycast from player to desired
    const raycaster = new THREE.Raycaster();
    const from = new THREE.Vector3(t.position.x, t.position.y + 1.0, t.position.z);
    const to = desired.clone();
    const dirRay = to.clone().sub(from).normalize();
    raycaster.set(from, dirRay);
    const dist = to.distanceTo(from);
    // consider collidable objects marked with userData.collidable
    const collidables: THREE.Object3D[] = [];
    this.scene.traverse((o:any)=>{ if (o.isMesh && o.userData && o.userData.collidable) collidables.push(o); });
    const hits = raycaster.intersectObjects(collidables, true).filter(h=>h.distance < dist);
    let finalPos = desired;
    if (hits.length) {
      const h = hits[0];
      // move camera closer to hit point
      finalPos = from.clone().lerp(h.point, 0.9);
    }

    // apply smoothing
    this.camera.position.lerp(finalPos, 0.12);
    this.camera.lookAt(t.position.x, t.position.y + 1.0, t.position.z);
  }
}
