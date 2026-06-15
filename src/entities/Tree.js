export default class Tree extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "tree");

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(32, 32);
    this.body.setOffset(48, 160); // 128 x 192, 32 + 16, 160 + 0

    this.hp = 3;

    this.setDepth(this.body.center.y);
  }

  takeDamage(amount) {
    this.hp -= amount;

    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ffff44"); // prettier-ignore

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    for (let i = 0; i < 3; i++) {
      this.scene.resourceSystem.spawnDrop(
        "wood",
        this.x + Phaser.Math.Between(-10, 10),
        this.y + Phaser.Math.Between(-10, 10),
        1,
      );
    }

    this.destroy();
  }
}
