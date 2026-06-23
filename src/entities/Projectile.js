export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, target, damage, angle) {
    super(scene, x, y, "tower", "tower_1_lv1_projectile_0");

    this.scene = scene;
    this.target = target;
    this.damage = damage;
    this.rotation = angle;

    this.speed = 300;
    this.turnSpeed = 0.1;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.lifeTime = 1000;

    this.scene.time.delayedCall(this.lifeTime, () => {
      if (this.active) {
        this.destroy();
      }
    });
  }

  hit(enemy) {
    enemy.takeDamage(this.damage);
    this.destroy();
  }

  update() {
    if (this.target?.active) {
      const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.body.center.x, this.target.body.center.y); // prettier-ignore

      this.rotation = desiredAngle;
    }

    this.scene.physics.velocityFromRotation(this.rotation, this.speed, this.body.velocity); // prettier-ignore
  }
}
