export default class HealthComponent {
  constructor(owner, maxHP) {
    this.owner = owner;

    this.baseMaxHP = maxHP;
    this.maxHP = maxHP;
    this.hp = maxHP;
  }

  setMaxHP(maxHP) {
    this.maxHP = Math.max(1, maxHP);

    // Don't allow current health to exceed the new maximum.
    this.hp = Math.min(this.hp, this.maxHP);
  }

  takeDamage(amount) {
    this.hp -= amount;

    if (this.hp <= 0) {
      this.hp = 0;
      if (this.owner.enterDead) this.owner.enterDead();
    }
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHP);
  }

  get percent() {
    return this.hp / this.maxHP;
  }

  get isDead() {
    return this.hp <= 0;
  }
}
