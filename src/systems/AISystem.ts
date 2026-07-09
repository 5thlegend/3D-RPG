import { System } from '../engine/Game';
import { World } from '../engine/ecs';
import { Transform } from '../components/Transform';
import * as THREE from 'three';

// A* helpers
type Node = { x:number; y:number; g:number; h:number; f:number; parent?: Node };
function neighbors(grid:number[][], x:number, y:number) {
  const res: [number,number][] = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    if (nx>=0 && ny>=0 && nx<grid.length && ny<grid[0].length && grid[nx][ny]===0) res.push([nx,ny]);
  }
  return res;
}
function astar(grid:number[][], start:[number,number], goal:[number,number]) : [number,number][] | null {
  const open = new Map<string, Node>();
  const closed = new Set<string>();
  const startN = {x:start[0], y:start[1], g:0, h:0, f:0};
  startN.h = Math.abs(startN.x - goal[0]) + Math.abs(startN.y - goal[1]);
  startN.f = startN.h;
  open.set(`${startN.x},${startN.y}`, startN);
  while (open.size) {
    let current: Node | null = null;
    for (const n of open.values()) if (!current || n.f < current.f) current = n;
    if (!current) break;
    const key = `${current.x},${current.y}`;
    if (current.x === goal[0] && current.y === goal[1]) {
      const path: [number,number][] = [];
      let cur: Node | undefined = current;
      while (cur) { path.push([cur.x, cur.y]); cur = cur.parent; }
      return path.reverse();
    }
    open.delete(key);
    closed.add(key);
    for (const [nx,ny] of neighbors(grid, current.x, current.y)) {
      const nkey = `${nx},${ny}`;
      if (closed.has(nkey)) continue;
      const tentativeG = current.g + 1;
      let neighbor = open.get(nkey);
      if (!neighbor || tentativeG < neighbor.g) {
        const node: Node = { x:nx, y:ny, g:tentativeG, h:0, f:0, parent:current };
        node.h = Math.abs(nx - goal[0]) + Math.abs(ny - goal[1]);
        node.f = node.g + node.h;
        open.set(nkey, node);
      }
    }
  }
  return null;
}

export class AISystem implements System {
  private world!: World;
  private grid: number[][] = [];
  private enemies: { entity:number; state:string; path?: [number,number][]; pathIndex?: number; patrolPts?: [number,number][] }[] = [];

  start() {
    // @ts-ignore
    const game = window.__GAME__;
    this.world = game.world;
    const dungeon = game.systems.find((s:any)=>s.constructor.name === 'BSPDungeonGenerator');
    if (dungeon && dungeon.getGrid) this.grid = dungeon.getGrid();

    // spawn one enemy near center
    const entity = this.world.createEntity();
    const createTransform = require('../components/Transform').createTransform;
    const t = createTransform(Math.floor(this.grid.length/2)+2,1,Math.floor(this.grid[0].length/2));
    this.world.addComponent(entity, 'Transform', t);
    const THREE = require('three');
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8,1.6,0.8), new THREE.MeshStandardMaterial({color:0xff4444}));
    this.world.addComponent(entity, 'Model', { mesh });
    game.scene.add(mesh);
    this.world.addComponent(entity, 'Health', { hp: 30, max: 30 });
    this.enemies.push({ entity, state: 'patrol', patrolPts: [[t.position.x-2,t.position.z-2],[t.position.x+2,t.position.z+2]] });
  }

  update(dt:number) {
    const players = this.world.query('Transform','Player');
    const playerEnt = players.length ? players[0].entity : null;
    const playerT = playerEnt ? this.world.getComponent<Transform>(playerEnt,'Transform') : null;

    for (const e of this.enemies) {
      const t = this.world.getComponent<Transform>(e.entity);
      if (!t) continue;
      if (e.state === 'patrol') {
        if (!e.patrolPts || e.patrolPts.length===0) continue;
        if (!e.path) {
          const start: [number,number] = [Math.round(t.position.x), Math.round(t.position.z)];
          const goal = e.patrolPts[0];
          e.path = astar(this.grid, start, goal as [number,number]) || [];
          e.pathIndex = 0;
        }
        if (e.path && e.pathIndex! < e.path.length) {
          const [nx,ny] = e.path[e.pathIndex!];
          const targetPos = new THREE.Vector3(nx, t.position.y, ny);
          const dir = targetPos.clone().sub(t.position);
          const speed = 2;
          if (dir.length() < 0.1) { e.pathIndex!++; if (e.pathIndex!>=e.path.length) { e.patrolPts!.push(e.patrolPts!.shift()!); e.path = undefined; } }
          else { dir.normalize(); t.position.add(dir.multiplyScalar(speed * dt)); const model = this.world.getComponent(e.entity,'Model'); if (model) model.mesh.position.copy(t.position); }
        }
      }

      if (playerT) {
        const dist = new THREE.Vector3().subVectors(playerT.position, t.position).length();
        if (dist < 8) {
          e.state = 'chase';
          const start: [number,number] = [Math.round(t.position.x), Math.round(t.position.z)];
          const goal: [number,number] = [Math.round(playerT.position.x), Math.round(playerT.position.z)];
          e.path = astar(this.grid, start, goal) || [];
          e.pathIndex = 0;
        }
        if (e.state === 'chase' && e.path && e.pathIndex! < e.path.length) {
          const [nx,ny] = e.path[e.pathIndex!];
          const targetPos = new THREE.Vector3(nx, t.position.y, ny);
          const dir = targetPos.clone().sub(t.position);
          const speed = 3;
          if (dir.length() < 0.3) e.pathIndex!++;
          else { dir.normalize(); t.position.add(dir.multiplyScalar(speed * dt)); const model = this.world.getComponent(e.entity,'Model'); if (model) model.mesh.position.copy(t.position); }
        }
        if (dist < 1.5) e.state = 'attack';
        if (dist > 12) e.state = 'patrol';
      }
    }
  }
}
