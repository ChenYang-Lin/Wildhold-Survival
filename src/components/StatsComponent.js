import { EQUIPMENT } from "../data/equipment.js";

export default class StatsComponent {
  constructor(owner, baseStats = {}) {
    this.owner = owner;

    this.auraFactory = owner.scene.auraFactory;

    this.base = {
      speed: baseStats.speed ?? 50,
      damage: baseStats.damage ?? 1,
      attackCooldown: baseStats.attackCooldown ?? 1000,
      attackSpeed: baseStats.attackSpeed ?? 1,

      maxHealth: baseStats.maxHealth ?? 100,

      critChance: baseStats.critChance ?? 0,
      critDamage: baseStats.critDamage ?? 1.5,

      maxStamina: baseStats.maxStamina ?? 100,
      staminaDrainRate: baseStats.staminaDrainRate ?? 20,
      staminaRegenRate: baseStats.staminaRegenRate ?? 20,
    };

    this.current = {
      ...this.base,
    };

    this.equipment = {
      ...this.base,
    };

    this.currentStamina = baseStats.stamina ?? this.base.maxStamina;

    this.staminaRegenDelay = 1000;
    this.staminaRegenTimer = 0;

    this.activeBuffs = new Map();
  }

  get attackSpeed() {
    return this.current.attackSpeed;
  }

  get damage() {
    return this.current.damage;
  }

  get critChance() {
    return this.current.critChance;
  }

  get critDamage() {
    return this.current.critDamage;
  }

  get speed() {
    return this.current.speed;
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

  destroy() {
    for (const entry of this.activeBuffs.values()) {
      entry.timer?.remove();
      entry.aura?.destroy();
    }

    this.activeBuffs.clear();
  }

  refreshStats() {
    // Reset equipment-adjusted stats to the player's base stats.
    this.equipment = { ...this.base };

    const equipmentSystem = this.owner.scene?.equipmentSystem;
    const equippedItems = equipmentSystem?.getEquippedItems() || {};

    // Multipliers start at 1, meaning no change.
    let attackSpeedMultiplier = 1;
    let movementSpeedMultiplier = 1;

    // Collect bonuses from every equipped item.
    for (const itemId of Object.values(equippedItems)) {
      if (!itemId) continue;

      const item = EQUIPMENT[itemId];

      if (!item?.bonuses) continue;

      for (const [stat, value] of Object.entries(item.bonuses)) {
        switch (stat) {
          case "attackSpeedMultiplier":
            attackSpeedMultiplier *= value;
            break;

          case "movementSpeedMultiplier":
            movementSpeedMultiplier *= value;
            break;

          case "damage":
          case "maxHealth":
          case "critChance":
          case "critDamage":
            this.equipment[stat] += value;
            break;

          default:
            console.warn(`Unknown equipment bonus: ${stat}`);
        }
      }
    }

    // Apply percentage-based bonuses.
    this.equipment.attackSpeed *= attackSpeedMultiplier;
    this.equipment.speed *= movementSpeedMultiplier;

    // Prevent critical chance from exceeding 100%.
    this.equipment.critChance = Math.min(1, Math.max(0, this.equipment.critChance));

    // Start current stats with equipment-adjusted stats.
    this.current = { ...this.equipment };

    // Apply temporary buffs after equipment bonuses.
    for (const entry of this.activeBuffs.values()) {
      const buff = entry.buff;

      switch (buff.operation) {
        case "multiply":
          if (buff.stat in this.current) {
            this.current[buff.stat] *= buff.value;
          }
          break;

        case "add":
          if (buff.stat in this.current) {
            this.current[buff.stat] += buff.value;
          }
          break;
      }
    }

    // Convert attack speed into the cooldown used by attack systems.
    this.current.attackCooldown = this.base.attackCooldown / this.current.attackSpeed;

    // Keep current stamina within its maximum.
    this.currentStamina = Math.min(this.currentStamina, this.current.maxStamina);

    // Keep current health within the updated maximum health.
    this.owner.health?.onMaxHealthChanged();
  }
}
