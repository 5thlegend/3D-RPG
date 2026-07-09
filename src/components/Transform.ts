import * as THREE from 'three';

export type Transform = { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 };
export function createTransform(x=0,y=0,z=0): Transform {
  return { position: new THREE.Vector3(x,y,z), rotation: new THREE.Euler(), scale: new THREE.Vector3(1,1,1) };
}
