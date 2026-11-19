export default class ArrowProjectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, angle, damage, ownerType = "enemy", hitOptions = {}) {
    super(scene, x, y, "arrow");

    this.scene = scene;
    this.damage = damage;
    this.ownerType = ownerType;
    this.hitOptions = hitOptions;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.body.setSize(8, 8);
    this.body.setOffset((this.width - 8) / 2, (this.height - 8) / 2);

    this.rotation = angle;

    const speed = 250;

    this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);

    // Only enemy arrows need these overlaps.
    if (this.ownerType === "enemy") {
      this.addEnemyOverlaps();
    }

    this.lifeTimer = this.scene.time.delayedCall(3000, () => {
      this.die();
    });
  }

  addEnemyOverlaps() {
    // Player
    this.scene.physics.add.overlap(this, this.scene.player, (_, player) => {
      player.takeDamage(this.damage, this);
      this.die();
    });

    // Buildings
    this.scene.physics.add.overlap(this, this.scene.buildingManager.buildings, (_, building) => {
      if (building.texture.key === "spike") return;

      building.takeDamage(this.damage, this);
      this.die();
    });

    // Base
    this.scene.physics.add.overlap(this, this.scene.base, (_, base) => {
      base.takeDamage(this.damage, this);
      this.die();
    });
  }

  // Called by GameScene when a player arrow hits an enemy.
  hit(enemy) {
    if (!this.active || this.ownerType !== "player") return;

    enemy.takeDamage(this.damage, this.hitOptions);

    this.die();
  }

  die() {
    if (!this.active) return;

    if (this.lifeTimer) {
      this.scene.time.removeEvent(this.lifeTimer);
      this.lifeTimer = null;
    }

    if (this.body) {
      this.body.enable = false;
    }

    this.destroy();
  }

  update() {
    if (!this.active) return;
  }
}
