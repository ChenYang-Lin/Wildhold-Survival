export default class Building extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, frame = undefined) {
    super(scene, x, y, texture, frame);

    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true);
    this.setImmovable(true);

    this.maxHP = 10;
    this.hp = this.maxHP;

    // Health bar
    this.hpBar = this.scene.add.graphics();

    // Health regeneration
    this.regenEvent = this.scene.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        if (!this.active) return;
        if (this.hp < this.maxHP && !this.scene.dayNightSystem.isNight) {
          this.setHP(this.hp + 1);
        }
      },
    });
  }

  setHP(newHP) {
    this.hp = Phaser.Math.Clamp(newHP, 0, this.maxHP);
    this.drawHealthBar();
  }

  drawHealthBar() {
    if (!this.active) return;

    this.hpBar.clear();

    const percent = this.hp / this.maxHP;

    const width = this.body.width;
    const height = 5;

    const x = this.body.center.x - width / 2;
    const y = this.body.top - 10;

    this.hpBar.fillStyle(0x222222);
    this.hpBar.fillRect(x, y, width, height);

    this.hpBar.fillStyle(0x00ff00);
    this.hpBar.fillRect(x, y, width * percent, height);

    this.hpBar.setDepth(this.depth + 1);

    if (this.hp === this.maxHP) {
      this.hpBar.clear();
      return;
    }
  }

  takeDamage(amount, source) {
    if (!this.active) return;

    this.setHP(this.hp - amount);

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

  die() {
    if (this.regenEvent) {
      this.regenEvent.remove();
      this.regenEvent = null;
    }

    if (this.hpBar) {
      this.hpBar.destroy();
    }

    this.scene.buildingManager.removeBuilding(this);
  }
}
