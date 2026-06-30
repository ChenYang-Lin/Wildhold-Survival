export default class Rock extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "rock");

    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true);

    this.hp = 5;
    this.body.setSize(32, 32);
  }

  takeDamage(amount) {
    this.hp -= amount;

    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ffff44"); // prettier-ignore

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.scene.rockManager.onRockDestroyed(this);

    for (let i = 0; i < 3; i++) {
      this.scene.resourceSystem.spawnDrop(
        "stone",
        this.x + Phaser.Math.Between(-10, 10),
        this.y + Phaser.Math.Between(-10, 10),
        1,
      );
    }

    this.destroy();
  }
}
