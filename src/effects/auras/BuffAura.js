import BaseAura from "./BaseAura.js";

export default class BuffAura extends BaseAura {
  constructor(scene, owner, config) {
    super(scene, owner);

    this.color = config.color;
    this.count = config.count ?? 4;
    this.radius = config.radius ?? 16;
    this.lineWidth = config.lineWidth ?? 2;
    this.lineHeight = config.lineHeight ?? 14;
    this.riseSpeed = config.riseSpeed ?? 30;

    this.particles = [];

    this.spawnParticles();
  }

  spawnParticles() {
    for (let i = 0; i < this.count; i++) {
      const rect = this.scene.add.rectangle(0, 0, this.lineWidth, this.lineHeight, this.color);

      rect.x = Phaser.Math.Between(-10, 10);
      rect.y = Phaser.Math.Between(10, 16);

      this.container.add(rect);

      const particle = {
        rect,
        life: 0,
        maxLife: 2000,
        speed: Phaser.Math.FloatBetween(this.riseSpeed - 2, this.riseSpeed + 2),
        delay: i * 150, // 0ms, 150ms, 300ms, 450ms...
      };

      this.particles.push(particle);
    }
  }

  respawn(p) {
    p.life = 0;

    p.rect.x = Phaser.Math.Between(-10, 10);
    p.rect.y = Phaser.Math.Between(10, 16);

    p.rect.alpha = 0.7;
  }

  update(time, delta) {
    super.update();

    for (const p of this.particles) {
      if (p.delay > 0) {
        p.delay -= delta;
        continue;
      }

      p.rect.y -= (p.speed * delta) / 1000;

      p.life += delta;

      p.rect.alpha = 0.7 * (1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.respawn(p);
      }
    }
  }
}
