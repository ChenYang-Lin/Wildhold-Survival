export default class StatsComponent {
  constructor(owner, baseStats = {}) {
    this.owner = owner;

    this.base = {
      speed: baseStats.speed ?? 50,
      damage: baseStats.damage ?? 1,
      attackCooldown: baseStats.attackCooldown ?? 1000,
    };

    this.current = {
      ...this.base,
    };

    this.activeBuffs = new Map();
  }

  get speed() {
    return this.current.speed;
  }

  get damage() {
    return this.current.damage;
  }

  applyBuff(buff) {
    this.activeBuffs.set(buff.id, buff);

    this.refresh(buff.type);

    this.owner.scene.time.delayedCall(buff.duration, () => {
      if (!this.owner.active) return;

      this.activeBuffs.delete(buff.id);
      this.refresh(buff.type);
    });
  }

  refresh(type) {
    switch (type) {
      case "speed":
        this.refreshSpeed();
        break;

      case "damage":
        this.refreshDamage();
        break;
    }
  }

  refreshSpeed() {
    this.current.speed = this.base.speed;

    for (const buff of this.activeBuffs.values()) {
      if (buff.type !== "speed") continue;

      this.current.speed *= buff.multiplier;
    }
  }

  refreshDamage() {
    this.current.damage = this.base.damage;

    for (const buff of this.activeBuffs.values()) {
      if (buff.type !== "damage") continue;

      this.current.damage *= buff.multiplier;
    }
  }
}
