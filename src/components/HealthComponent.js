export default class HealthComponent {
  constructor(owner) {
    this.owner = owner;
    this.hp = owner.stats.current.maxHealth;
  }

  get maxHP() {
    return this.owner.stats.current.maxHealth;
  }

  get percent() {
    return this.hp / this.maxHP;
  }

  get isDead() {
    return this.hp <= 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);

    if (this.isDead) {
      this.owner.enterDead?.();
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }

  onMaxHealthChanged() {
    this.hp = Math.min(this.hp, this.maxHP);
  }
}
