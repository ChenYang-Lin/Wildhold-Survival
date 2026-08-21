import { meleeCombo } from "../data/attacks.js";

export default class AttackComponent {
  constructor(owner) {
    this.owner = owner;

    this.currentAttack = null;

    this.attackTimer = 0;
    this.hitTimerEvent = null;
    this.hitboxTimerEvent = null;

    this.hitbox = null;

    // Attack combo
    this.comboIndex = 0;
    this.comboQueued = false;
    this.comboWindowOpen = false;
  }

  isAttacking() {
    return this.currentAttack !== null;
  }

  startBasicMelee() {
    this.comboIndex = 0;
    this.comboQueued = false;

    return this.startAttack(meleeCombo[0]);
  }

  startNextComboAttack() {
    this.comboIndex++;

    return this.startAttack(meleeCombo[this.comboIndex]);
  }

  startAttack(attack) {
    if (this.currentAttack) return false;

    this.currentAttack = attack;

    // Start animation
    const attackSpeed = this.owner.stats.attackSpeed;
    const duration = 1000 / attackSpeed;

    const hitDelay = duration * attack.hitTimeRatio;

    this.playAttackAnimation(attack, duration);

    // Schedule hit
    this.hitTimerEvent = this.owner.scene.time.delayedCall(hitDelay, () => {
      this.hitTimerEvent = null;

      if (!this.owner.active) return;
      if (!this.currentAttack) return;

      this.createHitbox(attack);
    });

    // Schedule attack completion
    this.attackTimer = duration;

    this.comboQueued = false;
    this.comboWindowOpen = false;

    return true;
  }

  cancelAttack() {
    // cancel timers
    if (this.hitTimerEvent) {
      this.hitTimerEvent.remove(false);
      this.hitTimerEvent = null;
    }

    if (this.hitboxTimerEvent) {
      this.hitboxTimerEvent.remove(false);
      this.hitboxTimerEvent = null;
    }

    // destroy hitbox
    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }

    // stop attack animation
    this.owner.anims.stop();

    this.currentAttack = null;
    this.attackTimer = 0;

    // reset Animation
    this.owner.anims.timeScale = 1;
  }

  finishCurrentAttack() {
    this.owner.anims.timeScale = 1;

    if (this.comboQueued && this.comboIndex < 2) {
      this.currentAttack = null;
      this.startNextComboAttack();

      return;
    }

    // Combo finished
    this.currentAttack = null;
    this.attackTimer = 0;

    this.comboIndex = 0;
    this.comboQueued = false;
    this.comboWindowOpen = false;
  }

  playAttackAnimation(attack, duration) {
    const animationKey = attack.animation[this.owner.movement.facing];

    this.owner.play(animationKey, true);

    // Calculate this based on the animation's natural duration
    const animation = this.owner.anims.currentAnim;

    if (animation) {
      const naturalDuration = animation.duration;

      this.owner.anims.setProgress(0);

      // Phaser animation timeScale: naturalDuration / desiredDuration
      this.owner.anims.timeScale = naturalDuration / duration;
    }
  }

  createHitbox(attack) {
    let hitX = this.owner.body.center.x;
    let hitY = this.owner.body.center.y;

    let hitWidth = 48;
    let hitHeight = 32;

    const distance = 32;

    switch (this.owner.movement.facing) {
      case "up":
        hitY -= distance;
        hitWidth = 64;
        break;

      case "down":
        hitY += distance;
        hitWidth = 64;
        break;

      case "left":
        hitX -= distance;
        hitHeight = 64;
        break;

      case "right":
        hitX += distance;
        hitHeight = 64;
        break;
    }

    const hitbox = this.owner.scene.add.zone(hitX, hitY, hitWidth, hitHeight);

    this.hitbox = hitbox;

    this.owner.scene.physics.add.existing(hitbox);

    hitbox.body.setAllowGravity(false);

    // Enemy
    const hitEnemies = new Set();

    this.owner.scene.physics.add.overlap(hitbox, this.owner.scene.combatSystem.enemies, (_, enemy) => {
      if (hitEnemies.has(enemy)) return;

      hitEnemies.add(enemy);

      const damage = this.owner.stats.damage * attack.damageMultiplier;

      enemy.takeDamage(damage);
    });

    // Tree
    const hitTrees = new Set();
    this.owner.scene.physics.add.overlap(hitbox, this.owner.scene.trees, (_, tree) => {
      if (hitTrees.has(tree)) return;

      hitTrees.add(tree);
      tree.takeDamage(1);
    });

    // Rock
    const hitRocks = new Set();
    this.owner.scene.physics.add.overlap(hitbox, this.owner.scene.rocks, (_, rock) => {
      if (hitRocks.has(rock)) return;

      hitRocks.add(rock);
      rock.takeDamage(1);
    });

    // Clear hitbox
    this.hitboxTimerEvent = this.owner.scene.time.delayedCall(attack.hitboxDuration, () => {
      this.hitboxTimerEvent = null;

      if (hitbox.active) {
        hitbox.destroy();
      }

      if (this.hitbox === hitbox) {
        this.hitbox = null;
      }
    });
  }

  update(input, delta) {
    if (!this.currentAttack) return;

    this.attackTimer -= delta;

    const attackSpeed = this.owner.stats.attackSpeed;
    const duration = 1000 / attackSpeed;

    const comboWindowStart = duration * (this.currentAttack.comboWindowStartRatio ?? 0.5);

    if (!this.comboWindowOpen && this.attackTimer <= duration - comboWindowStart) {
      this.comboWindowOpen = true;
    }

    if (this.comboWindowOpen && input.actionPressed) {
      this.comboQueued = true;
    }

    if (this.attackTimer <= 0) {
      this.comboWindowOpen = false;
      this.finishCurrentAttack();
      console.log("timer < 0");
    }
  }
}
