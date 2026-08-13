export default class StatsComponent {
  constructor(owner, baseStats = {}) {
    this.owner = owner;

    this.auraFactory = owner.scene.auraFactory;

    this.base = {
      speed: baseStats.speed ?? 50,
      damage: baseStats.damage ?? 1,
      attackCooldown: baseStats.attackCooldown ?? 1000,

      maxStamina: baseStats.maxStamina ?? 100,
      staminaDrainRate: baseStats.staminaDrainRate ?? 20,
      staminaRegenRate: baseStats.staminaRegenRate ?? 20,
    };

    this.current = {
      ...this.base,
    };

    this.currentStamina = baseStats.stamina ?? this.base.maxStamina;

    this.staminaRegenDelay = 1000;
    this.staminaRegenTimer = 0;

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

  get staminaDrainRate() {
    return this.current.staminaDrainRate;
  }

  get staminaRegenRate() {
    return this.current.staminaRegenRate;
  }

  updateStaminaRegen(delta) {
    if (this.staminaRegenTimer > 0) {
      this.staminaRegenTimer -= delta;
      return;
    }

    const amount = this.staminaRegenRate * (delta / 1000);
    this.recoverStamina(amount);
  }

  consumeStamina(amount) {
    this.currentStamina = Math.max(0, this.currentStamina - amount);

    this.staminaRegenTimer = this.staminaRegenDelay;
  }

  recoverStamina(amount) {
    this.currentStamina = Math.min(this.current.maxStamina, this.currentStamina + amount);
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
