import { System } from '../engine/Game';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class EnvironmentSystem implements System {
  private loaded = false;
  start() {
    // @ts-ignore
    const game = window.__GAME__;
    const scene = game.scene;
    const renderer = game.renderer as THREE.WebGLRenderer;
    const hdrPath = '/assets/env_royal_esplanade_1k.hdr';
    const loader = new RGBELoader();
    loader.load(hdrPath, (texture) => {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const env = pmrem.fromEquirectangular(texture).texture;
      scene.environment = env;
      scene.background = env; // optional: set as background for stronger lighting
      texture.dispose();
      pmrem.dispose();
      this.loaded = true;
      console.log('Environment HDR applied');
    }, undefined, (err) => { console.warn('Failed to load HDR:', err); });
  }

  update(dt:number) {}
}
