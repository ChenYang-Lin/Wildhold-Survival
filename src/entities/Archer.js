import Enemy from "./Enemy.js";
import EnemyProjectile from "./EnemyProjectile.js";

export default class Archer extends Enemy {
  constructor(scene, x, y, stats = {}, campNode) {
    const archerStats = {
      attackRange: stats.attackRange ?? 180,
      attackDamage: stats.damage ?? 1,
      attackCooldown: stats.attackCooldown ?? 2000,

      windupDuration: stats.windupDuration ?? 500,
      attackDelay: stats.attackDelay ?? 800,
      attackRecoverDuration: stats.attackRecoverDuration ?? 1200,
      hitboxLifetime: stats.hitboxLifetime ?? 80,
    };

    super(scene, x, y, "goblin_archer", "goblin_archer_idle_down", archerStats, campNode);

    this.type = "goblin_archer";

    this.setOrigin(0.5, 0.5);
    this.body.setSize(32, 32);
    this.body.setOffset(80, 96); // 192 x 192, 32 + 32 + 16, 32 + 32 + 16 + 16
  }

  static preload(scene) {
    scene.load.atlas("goblin_archer", "assets/enemy/goblin_archer.png", "assets/enemy/goblin_archer_atlas.json");
    scene.load.animation("goblin_archer_anim", "assets/enemy/goblin_archer_anim.json");
  }

  attack(damage) {
    super.attack(damage);

    this.shootArrow(damage);
  }

  shootArrow(damage) {
    const target = this.ai.getAttackTarget();

    const angle = Phaser.Math.Angle.Between(this.body.center.x, this.body.center.y, target.body.center.x, target.body.center.y);
    const projectile = new EnemyProjectile(this.scene, this.body.center.x, this.body.center.y, angle, damage);

    this.scene.enemyProjectiles.add(projectile);
  }

  update(time) {
    super.update(time);
  }
}
