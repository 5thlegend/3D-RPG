import './style.css';
import { Game } from './engine/Game';
import { BSPDungeonGenerator } from './systems/BSPDungeonGenerator';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { AnimationSystem } from './systems/AnimationSystem';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { AISystem } from './systems/AISystem';
import { CombatSystem } from './systems/CombatSystem';
import { RenderSystem } from './systems/RenderSystem';

const game = new Game({
  width: window.innerWidth,
  height: window.innerHeight,
  parent: document.getElementById('app')!,
});

// expose for systems (replace with DI in production)
// @ts-ignore
window.__GAME__ = game;

game.addSystem(new BSPDungeonGenerator(48, 48, { minRoom: 6 }));
game.addSystem(new PhysicsSystem());
game.addSystem(new AnimationSystem());
game.addSystem(new PlayerControlSystem());
game.addSystem(new AISystem());
game.addSystem(new CombatSystem());
game.addSystem(new RenderSystem());

game.start();
window.addEventListener('resize', () => game.onResize(window.innerWidth, window.innerHeight));
