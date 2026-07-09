import { System } from '../engine/Game';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type Actor = { entity: number; mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction> };

export class AnimationSystem implements System {
  private actors = new Map<number, Actor>();
  private loader = new GLTFLoader();

  start() {}

  async loadCharacter(url: string, entity: number, onReady?: (mesh: THREE.Object3D) => void) {
    const gltf = await this.loader.loadAsync(url);
    const root = gltf.scene;
    // @ts-ignore
    const game = window.__GAME__;
    const world = game.world;
    world.addComponent(entity, 'Model', { mesh: root });
    game.scene.add(root);

    if (gltf.animations && gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(root);
      const actions: Record<string, THREE.AnimationAction> = {};
      for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
      this.actors.set(entity, { entity, mixer, actions });
    }
    onReady?.(root);
  }

  play(entity: number, actionName: string, fade=0.15) {
    const actor = this.actors.get(entity);
    if (!actor) return;
    const next = actor.actions[actionName];
    if (!next) return;
    for (const a of Object.values(actor.actions)) a.stop();
    next.reset().fadeIn(fade).play();
  }

  update(dt:number) {
    for (const a of this.actors.values()) a.mixer.update(dt);
  }
}
