export default class StatsComponent {
  constructor(owner, baseStats = {}) {
    this.owner = owner;

    this.auraFactory = owner.scene.auraFactory;

    this.base = {
      speed: baseStats.speed ?? 50,
      damage: baseStats.damage ?? 1,
      attackCooldown: baseStats.attackCooldown ?? 1000,

      maxStamina: baseStats.maxStamina ?? 100,
    };

    this.current = {
      ...this.base,
    };

    this.currentStamina = baseStats.stamina ?? this.base.maxStamina;

    this.activeBuffs = new Map();
  }

  get speed() {
    return this.current.speed;
  }

  get damage() {
    return this.current.damage;
  }

  get stamina() {
    return this.currentStamina;
  }

  get staminaPercent() {
    return this.stamina / this.current.maxStamina;
  }

  consumeStamina(amount) {
    this.stamina = Math.max(0, this.stamina - amount);
  }

  recoverStamina(amount) {
    this.stamina = Math.min(this.current.maxStamina, this.stamina + amount);
  }

  hasStamina(amount) {
    return this.stamina >= amount;
  }

  findBuff(type) {
    for (const entry of this.activeBuffs.values()) {
      if (entry.buff.effectType === type) return entry;
    }

    return null;
  }

  createBuffTimer(id, duration) {
    return this.owner.scene.time.delayedCall(duration, () => this.removeBuff(id));
  }

  applyBuff(buff) {
    const existing = this.findBuff(buff.effectType);

    if (existing) {
      existing.timer.remove();

      buff.id = existing.buff.id;

      existing.buff = buff;

      existing.timer = this.createBuffTimer(buff.id, buff.duration);

      this.refreshStats();

      return;
    }

    const aura = this.auraFactory.createAura(this.owner.scene, this.owner, buff);

    console.log(aura);

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
