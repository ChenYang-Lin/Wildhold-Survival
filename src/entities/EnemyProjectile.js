export default class EnemyProjetile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, target, damage) {
    super(scene, x, y, "arrow");

    this.scene = scene;
    this.target = target;
    this.damage = damage;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.scene.physics.moveToObject(this, target, 250);

    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      target.body.center.x,
      target.body.center.y,
    );

    this.rotation = angle;

    this.scene.time.delayedCall(3000, () => {
      if (this.active) {
        this.destroy();
      }
    });
  }

  update() {
    if (!this.target?.active) {
      this.destroy();
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.body.center.x, this.target.body.center.y); // prettier-ignore

    if (dist < 16) {
      this.target.takeDamage(this.damage);
      this.destroy();
    }
  }
}
