export default class StatsComponent {
  constructor(owner, baseStats = {}) {
    this.owner = owner;

    this.auraFactory = owner.scene.auraFactory;

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

  findBuff(type) {
    for (const entry of this.activeBuffs.values()) {
      if (entry.buff.type === type) return entry;
    }

    return null;
  }

  createBuffTimer(id, duration) {
    return this.owner.scene.time.delayedCall(duration, () => this.removeBuff(id));
  }

  applyBuff(buff) {
    const existing = this.findBuff(buff.type);

    if (existing) {
      existing.timer.remove();

      buff.id = existing.buff.id;

      existing.buff = buff;

      existing.timer = this.createBuffTimer(buff.id, buff.duration);

      this.refreshStats();

      return;
    }

    const aura = this.auraFactory.createAura(this.owner.scene, this.owner, buff);

    const timer = this.createBuffTimer(buff.id, buff.duration);

    this.activeBuffs.set(buff.id, {
      buff,
      aura,
      timer,
    });

    this.refreshStats();
  }

  removeBuff(id) {
    const entry = this.activeBuffs.get(id);

    if (!entry) return;

    entry.aura?.destroy();

    entry.timer?.remove();

    this.activeBuffs.delete(id);

    this.refreshStats();
  }

  refreshStats() {
    this.current = {
      ...this.base,
    };

    for (const entry of this.activeBuffs.values()) {
      const buff = entry.buff;

      switch (buff.operation) {
        case "multiply":
          this.current[buff.stat] *= buff.value;
          break;

        case "add":
          this.current[buff.stat] += buff.value;
          break;
      }
    }
  }
}
