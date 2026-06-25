import { BUILDINGS } from "../data/buildings.js";

export default class Wall extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "wall");

    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true);

    const offsetX = BUILDINGS["wall"].footprintOffsetX * 32;
    const offsetY = BUILDINGS["wall"].footprintOffsetY * 32;
    this.body.setOffset(offsetX, offsetY); // prettier-ignore

    this.setImmovable(true);

    this.maxHP = 10;
    this.hp = this.maxHP;

    // Todo: Need to delete event after wall destroyed
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

  repair(amount) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }

  isAttackable() {
    return true;
  }

  die() {
    this.scene.buildingManager.removeBuilding(this);

    if (this.regenEvent) {
      this.regenEvent.remove();
    }

    this.destroy();
  }
}
