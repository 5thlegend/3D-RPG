import * as THREE from 'three';
import { World } from './ecs';

export type System = { start?: () => void; update: (dt: number) => void; fixedUpdate?: (dt: number) => void };

export class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  world: World;
  systems: System[] = [];

  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;

  constructor(opts: { width: number; height: number; parent: HTMLElement }) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111217);
    this.camera = new THREE.PerspectiveCamera(60, opts.width / opts.height, 0.1, 1000);
    this.camera.position.set(6, 6, 10);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(opts.width, opts.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    opts.parent.appendChild(this.renderer.domElement);
    this.world = new World();
  }

  addSystem(s: System) {
    this.systems.push(s);
  }

  start() {
    for (const s of this.systems) s.start?.();
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(timeMs: number) {
    const t = timeMs * 0.001;
    if (!this.lastTime) this.lastTime = t;
    let frameDt = t - this.lastTime;
    this.lastTime = t;
    frameDt = Math.min(frameDt, 0.25);
    this.accumulator += frameDt;

    while (this.accumulator >= this.fixedDt) {
      for (const s of this.systems) s.fixedUpdate?.(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    for (const s of this.systems) s.update(frameDt);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop.bind(this));
  }

  onResize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
