export default class CombatComponent {
  constructor(owner, stats = {}) {
    this.owner = owner;
    this.scene = owner.scene;

    this.attackRange = stats.attackRange ?? 32;
    this.attackDamage = stats.damage ?? 1;

    this.attackCooldown = stats.attackCooldown ?? 1000;
    this.canAttack = true;

    this.windupDuration = stats.windupDuration ?? 500;
    this.attackDelay = stats.attackDelay ?? 500;
    this.attackRecoverDuration = stats.attackRecoverDuration ?? 800;
    this.hitboxLifetime = stats.hitboxLifetime ?? 80;
  }

  startAttackCooldown() {
    this.canAttack = false;

    this.scene.time.delayedCall(this.attackCooldown, () => {
      if (this.owner.active) {
        this.canAttack = true;
      }
    });
  }

  // check if target in attack range
  isTargetInAttackRange(target) {
    if (!target) return false;

    const distance = this.owner.distanceTo(target);

    return distance - target.body.width / 2 <= this.attackRange;
  }

  performAttack(callbacks) {
    callbacks = callbacks ?? {};

    this.startAttackCooldown();

    this.scene.time.delayedCall(this.attackDelay, () => {
      if (!this.owner.active) return;

      if (this.owner.health.isDead) return;

      this.owner.attack(this.attackDamage);
    });

    this.scene.time.delayedCall(this.attackRecoverDuration, () => {
      if (!this.owner.active) return;

      if (this.owner.health.isDead) return;

      callbacks.onRecover?.();
    });
  }

  startAttackSequence(options) {
    this.scene.time.delayedCall(this.windupDuration, () => {
      options?.onWindupComplete?.();
    });
  }
}
