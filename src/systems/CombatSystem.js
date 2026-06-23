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

  spawnEnemy(x, y, stats = {}) {
    const enemy = new Enemy(this.scene, x, y, stats);
    const archer = new Archer(this.scene, x, y);
    this.enemies.add(enemy);
    this.enemies.add(archer);

    return enemy;
  }

  spawnEnemyEdge() {
    const side = Phaser.Math.Between(0, 3);

    let x, y;

    if (side === 0) {
      // top
      x = Phaser.Math.Between(0, 1600);
      y = 0;
    } else if (side === 1) {
      // bottom
      x = Phaser.Math.Between(0, 1600);
      y = 1200;
    } else if (side === 2) {
      // left
      x = 0;
      y = Phaser.Math.Between(0, 1200);
    } else {
      // right
      x = 1600;
      y = Phaser.Math.Between(0, 1200);
    }

    const enemy = new Enemy(this.scene, x, y);
    this.enemies.add(enemy);
    // enemy.hp = 3;
    // enemy.speed = 50 + this.wave * 5;
    enemy.hp = 2 + Math.floor(this.scene.wave * 0.5);
    enemy.speed = 50 + this.scene.wave * 3;
  }

  update() {
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;

      enemy.update();
    });
  }
}
