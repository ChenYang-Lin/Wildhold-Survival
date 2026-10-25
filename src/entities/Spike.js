export default class Spike extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "spike");

    this.scene = scene;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // The spike must not block enemy movement.
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);

    this.damage = 2;
    this.damageInterval = 1000;
    this.enemyDamageTimers = new Map();
  }

  damageEnemy(enemy) {
    if (!this.active || !enemy?.active) return;
    if (enemy.aiState === enemy.STATE_DEAD) return;

    const now = this.scene.time.now;
    const nextDamageTime = this.enemyDamageTimers.get(enemy) ?? 0;

    if (now < nextDamageTime) return;

    enemy.takeDamage(this.damage);

    this.enemyDamageTimers.set(enemy, now + this.damageInterval);
  }

  destroy(fromScene) {
    this.enemyDamageTimers.clear();
    super.destroy(fromScene);
  }
}
