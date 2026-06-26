export default class EnemyProjetile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, angle, damage) {
    super(scene, x, y, "arrow");

    this.scene = scene;
    this.damage = damage;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.body.setSize(8, 8);
    this.body.setOffset((this.width - 8) / 2, (this.height - 8) / 2);
    this.rotation = angle;

    const speed = 250;

    this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);

    this.addOverlaps();

    this.lifeTimer = this.scene.time.delayedCall(3000, () => {
      if (this.active) {
        this.destroy();
      }
    });
  }

  addOverlaps() {
    this.scene.physics.add.overlap(this, this.scene.player, (_, player) => {
      player.takeDamage(this.damage, this);
      this.die();
    });

    this.scene.physics.add.overlap(
      this,
      this.scene.buildingManager.buildings,
      (_, building) => {
        building.takeDamage(this.damage, this);
        this.die();
      },
    );

    this.scene.physics.add.overlap(this, this.scene.campfire, (_, campfire) => {
      campfire.takeDamage(this.damage, this);
      this.die();
    });
  }

  die() {
    if (!this.active) return;

    this.scene.time.removeEvent(this.lifeTimer);
    this.body.enable = false;
    this.destroy();
  }

  update() {
    if (!this.active) {
      return;
    }
  }
}
