import Archer from "../entities/Archer.js";
import Enemy from "../entities/Enemy.js";

export default class CombatSystem {
  constructor(scene) {
    this.scene = scene;

    this.enemies = this.scene.physics.add.group();
  }

  getEnemies() {
    return this.enemies;
  }

  spawnEnemy(x, y, stats = {}, type, campNode = this.scene.navigationManager.getNode("Camp_1")) {
    let enemy;
    if (type === "goblin") {
      enemy = new Enemy(this.scene, x, y, stats, campNode);
    } else if (type === "archer") {
      enemy = new Archer(this.scene, x, y, stats, campNode);
    }

    this.enemies.add(enemy);
    return enemy;
  }

  update() {
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;

      enemy.update();
    });
  }
}
