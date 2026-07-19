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

      this.spawnAttackHitbox();
    });

    this.scene.time.delayedCall(this.attackRecoverDuration, () => {
      if (!this.owner.active) return;

      if (this.owner.health.isDead) return;

      callbacks.onRecover?.();
    });
  }

  spawnAttackHitbox() {
    let hitX = this.owner.body.center.x;
    let hitY = this.owner.body.center.y;

    let hitWidth = 32;
    let hitHeight = 32;

    switch (this.owner.facing) {
      case "up":
        hitY -= 24;
        hitWidth = 32;
        break;
      case "down":
        hitY += 24;
        hitWidth = 32;
        break;
      case "left":
        hitX -= 24;
        hitHeight = 32;
        break;
      case "right":
        hitX += 24;
        hitHeight = 32;
        break;
    }

    const hitbox = this.scene.add.zone(hitX, hitY, hitWidth, hitHeight);

    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    const hitTargets = new Set();

    // Player
    this.scene.physics.add.overlap(hitbox, this.scene.player, (_, player) => {
      if (hitTargets.has(player)) return;

      hitTargets.add(player);
      player.takeDamage(this.attackDamage, this.owner);
    });

    // Buildings
    this.scene.physics.add.overlap(hitbox, this.scene.buildingManager.buildings, (_, building) => {
      if (hitTargets.has(building)) return;

      hitTargets.add(building);
      building.takeDamage(this.attackDamage, this.owner);
    });

    // Campfire
    this.scene.physics.add.overlap(hitbox, this.scene.campfire, (_, campfire) => {
      if (hitTargets.has(campfire)) return;

      hitTargets.add(campfire);
      campfire.takeDamage(this.attackDamage, this.owner);
    });

    // Destroy hitbox
    this.scene.time.delayedCall(this.hitboxLifetime, () => {
      hitbox.destroy();
    });
  }

  startAttackSequence(options) {
    this.scene.time.delayedCall(this.windupDuration, () => {
      options?.onWindupComplete?.();
    });
  }
}
