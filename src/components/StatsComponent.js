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
    this.activeBuffs.set(buff.id, {
      buff,
    });

    this.refreshStats();

    this.owner.scene.time.delayedCall(buff.duration, () => {
      this.removeBuff(buff.id);
    });
  }

  removeBuff(id) {
    const entry = this.activeBuffs.get(id);

    if (!entry) return;

    this.activeBuffs.delete(id);

    this.refreshStats();
  }

  refreshStats(type) {
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
