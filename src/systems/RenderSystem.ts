import { System } from '../engine/Game';
import { createTransform } from '../components/Transform';
import * as THREE from 'three';
import { World } from '../engine/ecs';

export class RenderSystem implements System {
  start() {}
  update(dt:number) {}

  static attachModel(world: World, scene: THREE.Scene, transform: any, mesh: THREE.Object3D) {
    const entity = world.createEntity();
    world.addComponent(entity, 'Transform', transform);
    world.addComponent(entity, 'Model', { mesh });

    // ensure shadows for all child meshes
    mesh.traverse((child:any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    mesh.position.copy(transform.position);
    mesh.rotation.copy(transform.rotation);
    mesh.scale.copy(transform.scale);
    scene.add(mesh);
    return entity;
  }
}
