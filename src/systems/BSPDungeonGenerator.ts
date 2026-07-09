import { System } from '../engine/Game';
import * as THREE from 'three';
import { createTransform } from '../components/Transform';
import { RenderSystem } from './RenderSystem';

export class BSPDungeonGenerator implements System {
  private width: number;
  private height: number;
  private options: { minRoom: number; maxRoom?: number };
  private world!: any;
  private scene!: THREE.Scene;
  private grid: number[][] = [];

  constructor(w:number,h:number, opts = { minRoom: 6 }) { this.width = w; this.height = h; this.options = opts as any; }

  start() {
    // @ts-ignore
    const game = window.__GAME__;
    this.world = game.world;
    this.scene = game.scene;
    this.grid = Array.from({length:this.width}, () => Array(this.height).fill(1));

    function partition(rect: any, minSize: number, out: any[]) {
      if (rect.w < minSize*2 && rect.h < minSize*2) { out.push(rect); return; }
      const splitH = Math.random() < 0.5 && rect.h >= minSize*2;
      if (splitH) {
        const split = Math.floor(minSize + Math.random()*(rect.h-minSize*2));
        partition({x:rect.x, y:rect.y, w:rect.w, h:split}, minSize, out);
        partition({x:rect.x, y:rect.y+split, w:rect.w, h:rect.h-split}, minSize, out);
      } else {
        const split = Math.floor(minSize + Math.random()*(rect.w-minSize*2));
        partition({x:rect.x, y:rect.y, w:split, h:rect.h}, minSize, out);
        partition({x:rect.x+split, y:rect.y, w:rect.w-split, h:rect.h}, minSize, out);
      }
    }

    const parts: any[] = [];
    partition({x:1,y:1,w:this.width-2,h:this.height-2}, this.options.minRoom, parts);
    const rooms: any[] = [];
    for (const p of parts) {
      const rw = Math.max(3, Math.floor(p.w * (0.4 + Math.random()*0.5)));
      const rh = Math.max(3, Math.floor(p.h * (0.4 + Math.random()*0.5)));
      const rx = p.x + Math.floor((p.w - rw)/2);
      const ry = p.y + Math.floor((p.h - rh)/2);
      rooms.push({x:rx,y:ry,w:rw,h:rh});
      for (let x=rx; x<rx+rw; x++) for (let y=ry; y<ry+rh; y++) this.grid[x][y] = 0;
    }

    const centers = rooms.map(r => ({ x: Math.floor(r.x + r.w/2), y: Math.floor(r.y + r.h/2) }));
    centers.sort((a,b)=>a.x - b.x);
    for (let i=1;i<centers.length;i++){
      const a = centers[i-1], b = centers[i];
      if (Math.random() < 0.5) {
        for (let x=Math.min(a.x,b.x); x<=Math.max(a.x,b.x); x++) this.grid[x][a.y]=0;
        for (let y=Math.min(a.y,b.y); y<=Math.max(a.y,b.y); y++) this.grid[b.x][y]=0;
      } else {
        for (let y=Math.min(a.y,b.y); y<=Math.max(a.y,b.y); y++) this.grid[a.x][y]=0;
        for (let x=Math.min(a.x,b.x); x<=Math.max(a.x,b.x); x++) this.grid[x][b.y]=0;
      }
    }

    // collect wall positions
    const wallPositions: THREE.Matrix4[] = [];
    for (let x=0;x<this.width;x++){
      for (let y=0;y<this.height;y++){
        if (this.grid[x][y] === 1) {
          const m = new THREE.Matrix4();
          const pos = new THREE.Vector3(x, 1, y);
          m.compose(pos, new THREE.Quaternion(), new THREE.Vector3(1,2,1));
          wallPositions.push(m);
        }
      }
    }

    // create instanced mesh for walls
    const wallGeo = new THREE.BoxGeometry(1,1,1);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const inst = new THREE.InstancedMesh(wallGeo, wallMat, wallPositions.length);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i=0;i<wallPositions.length;i++) inst.setMatrixAt(i, wallPositions[i]);
    inst.castShadow = true;
    inst.receiveShadow = true;
    // tag as collidable for simple camera raycast tests
    (inst as any).userData = { collidable: true };
    this.scene.add(inst);

    // floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), new THREE.MeshStandardMaterial({color:0x666666}));
    floor.rotation.x = -Math.PI/2;
    floor.position.set(this.width/2-0.5, 0, this.height/2-0.5);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff7df, 0.8);
    dir.position.set(10,20,10);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.left = -60;
    dir.shadow.camera.right = 60;
    dir.shadow.camera.top = 60;
    dir.shadow.camera.bottom = -60;
    this.scene.add(dir);
  }

  getGrid() { return this.grid; }
  update(dt:number) {}
}
