export default class CombatComponent {
  constructor(owner, stats = {}) {
    this.owner = owner;
    this.scene = owner.scene;

    this.attackRange = stats.attackRange ?? 32;

    this.attackCooldown = stats.attackCooldown ?? 1000;
    this.canAttack = true;

    this.windupDuration = stats.windupDuration ?? 500;
    this.attackDelay = stats.attackDelay ?? 500;
    this.attackRecoverDuration = stats.attackRecoverDuration ?? 800;
    this.hitboxLifetime = stats.hitboxLifetime ?? 80;

    this.windupTimer = null;
    this.attackDelayTimer = null;
    this.attackRecoverTimer = null;
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

  cancelAttack() {
    if (this.windupTimer) {
      this.windupTimer.remove(false);
      this.windupTimer = null;
    }

    if (this.attackDelayTimer) {
      this.attackDelayTimer.remove(false);
      this.attackDelayTimer = null;
    }

    if (this.attackRecoverTimer) {
      this.attackRecoverTimer.remove(false);
      this.attackRecoverTimer = null;
    }
  }

  performAttack(callbacks) {
    callbacks = callbacks ?? {};

    this.startAttackCooldown();

    this.attackDelayTimer = this.scene.time.delayedCall(this.attackDelay, () => {
      this.attackDelayTimer = null;

      if (!this.owner.active) return;
      if (this.owner.health.isDead) return;
      if (this.owner.aiState === this.owner.STATE_FLINCH) return;

      this.owner.attack();
    });

    this.attackRecoverTimer = this.scene.time.delayedCall(this.attackRecoverDuration, () => {
      this.attackRecoverTimer = null;

      if (!this.owner.active) return;
      if (this.owner.health.isDead) return;
      if (this.owner.aiState === this.owner.STATE_FLINCH) return;

      callbacks.onRecover?.();
    });
  }

  startAttackSequence(options) {
    this.cancelAttack();

    this.windupTimer = this.scene.time.delayedCall(this.windupDuration, () => {
      this.windupTimer = null;

      if (!this.owner.active) return;
      if (this.owner.health.isDead) return;
      if (this.owner.aiState === this.owner.STATE_FLINCH) return;

      options?.onWindupComplete?.();
    });
  }
}
