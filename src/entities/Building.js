export default class Building extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, frame = undefined) {
    super(scene, x, y, texture, frame);

    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true);
    this.setImmovable(true);

    this.maxHP = 10;
    this.hp = this.maxHP;

    // Health regeneration
    this.regenEvent = this.scene.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        if (!this.active) return;
        if (this.hp < this.maxHP && !this.scene.dayNightSystem.isNight) {
          this.hp++;
        }
      },
    });

    this.setDepth(this.body.center.y);
  }

  takeDamage(amount, source) {
    if (!this.active) return;

    this.hp -= amount;

    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ff8844"); // prettier-ignore

    // Show healthBar
    this.showHealthBar();

    this.hideHealthBarEvent?.remove();

    this.hideHealthBarEvent = this.scene.time.delayedCall(3000, () => {
      this.hideHealthBar();
    });

    // Damage flash
    this.setTint(0xff4444);

    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.regenEvent) {
      this.regenEvent.remove();
      this.regenEvent = null;
    }

    this.scene.buildingManager.removeBuilding(this);
  }
}
