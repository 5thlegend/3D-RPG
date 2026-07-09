import { System } from '../engine/Game';
import * as THREE from 'three';

export class AssetLoaderSystem implements System {
  start() {}
  update(dt:number) {}

  // load models after other systems have started
  async fixedUpdate(dt:number) {
    // run once, then replace fixedUpdate with noop
    // @ts-ignore
    const game = window.__GAME__;
    const animSys = game.systems.find((s:any)=>s.constructor.name === 'AnimationSystem');
    if (!animSys) return;

    // find player entity
    const players = game.world.query('Player');
    const playerEntity = players.length ? players[0].entity : null;

    const urls = {
      fox: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
      cesium: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
      avocado: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
      boombox: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb'
    };

    try {
      if (playerEntity) {
        await animSys.loadCharacter(urls.fox, playerEntity, (root: THREE.Object3D)=>{
          root.scale.setScalar(0.025);
          // ensure correct orientation and shadows
          root.traverse((c:any)=>{ if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        });
      }

      // spawn a CesiumMan as an enemy
      const enemyEnt = game.world.createEntity();
      const createTransform = require('../components/Transform').createTransform;
      const t = createTransform(10,1,10);
      game.world.addComponent(enemyEnt, 'Transform', t);
      await animSys.loadCharacter(urls.cesium, enemyEnt, (root: THREE.Object3D)=>{
        root.scale.setScalar(0.05);
        root.position.copy(t.position as any);
      });
      game.world.addComponent(enemyEnt, 'Health', { hp: 25, max: 25 });

      // load some props
      const prop1 = game.world.createEntity();
      const t2 = createTransform(5,0,5);
      game.world.addComponent(prop1, 'Transform', t2);
      await animSys.loadCharacter(urls.avocado, prop1, (root: THREE.Object3D)=>{
        root.scale.setScalar(0.2);
        root.position.copy(t2.position as any);
      });

      const prop2 = game.world.createEntity();
      const t3 = createTransform(8,0,6);
      game.world.addComponent(prop2, 'Transform', t3);
      await animSys.loadCharacter(urls.boombox, prop2, (root: THREE.Object3D)=>{
        root.scale.setScalar(0.02);
        root.position.copy(t3.position as any);
      });

    } catch (e) {
      console.warn('AssetLoaderSystem: failed to load some models', e);
    }

    // remove this fixedUpdate so it doesn't run again
    (this as any).fixedUpdate = function(){};
  }
}
