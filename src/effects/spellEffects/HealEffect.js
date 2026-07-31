import BaseSpellEffect from "./BaseSpellEffect.js";

export default class HealEffect extends BaseSpellEffect {
  constructor(scene, owner) {
    super(scene, owner);

    this.particles = [];

    this.spawnLines();
    this.spawnPluses();
  }

  spawnLines() {
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(-10, 10);
      const y = Phaser.Math.Between(10, 16);

      const rect = this.scene.add.rectangle(x, y, 2, 14, 0x66ff66);

      rect.alpha = 0.7;

      this.container.add(rect);

      this.particles.push({
        sprite: rect,
        speed: Phaser.Math.FloatBetween(20, 35),
        life: 0,
        maxLife: Phaser.Math.Between(800, 1000),
        delay: i * 120,
      });
    }
  }

  spawnPluses() {
    for (let i = 0; i < 3; i++) {
      const x = Phaser.Math.Between(-10, 10);
      const y = Phaser.Math.Between(10, 16);

      const plus = this.scene.add.text(x, y, "+", {
        fontSize: 16,
        color: "#66ff66",
        stroke: "#1b4d1b",
        strokeThickness: 2,
      });

      plus.setOrigin(0.5);
      plus.setAlpha(0.7);

      this.container.add(plus);

      this.particles.push({
        sprite: plus,
        speed: Phaser.Math.FloatBetween(12, 22),
        life: 0,
        maxLife: Phaser.Math.Between(900, 1200),
        delay: 200 + i * 180,
      });
    }
  }

  update(time, delta) {
    super.update(time, delta);

    let alive = false;

    for (const p of this.particles) {
      if (p.delay > 0) {
        p.delay -= delta;
        p.sprite.alpha = 0;
        continue;
      }

      p.life += delta;

      if (p.life < p.maxLife) alive = true;

      p.sprite.y -= (p.speed * delta) / 1000;

      p.sprite.alpha = 0.7 * (1 - p.life / p.maxLife);
    }

    if (!alive) this.destroy();
  }

  destroy() {
    super.destroy();
  }
}
