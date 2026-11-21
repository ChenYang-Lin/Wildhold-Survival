import { meleeCombo, sprintAttack, rangedAttack } from "../data/attacks.js";
import ArrowProjectile from "../entities/ArrowProjectile.js";

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

    // Sprint Attack
    this.lungeTimer = 0;
    this.lungeVelocity = new Phaser.Math.Vector2();
  }

  isAttacking() {
    return this.currentAttack !== null;
  }

  startSprintAttack() {
    this.comboIndex = 0;
    this.comboQueued = false;

    return this.startAttack(sprintAttack);
  }

  startRangedAttack(input) {
    if (this.currentAttack) return false;

    this.comboIndex = 0;
    this.comboQueued = false;

    const target = input?.isMobile ? this.getNearestEnemy(rangedAttack.targetRange) : null;

    let targetX;
    let targetY;

    if (target) {
      targetX = target.body.center.x;
      targetY = target.body.center.y;
    } else if (!input?.isMobile) {
      targetX = input?.aimWorldX;
      targetY = input?.aimWorldY;
    }

    // Store the target or mouse position for this attack.
    this.rangedAim = { target, targetX, targetY };

    // Update facing before the shooting animation starts.
    this.updateRangedFacing();

    return this.startAttack(rangedAttack, input);
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

  startAttack(attack, input = null) {
    if (this.currentAttack) return false;

    this.currentAttack = attack;

    // Attack takes control of movement.
    if (attack.lunge) {
      this.startLunge(attack.lunge);
    } else {
      this.owner.movement.stop();
    }

    // Start animation
    const attackSpeed = this.owner.stats.attackSpeed;
    const duration = 1000 / attackSpeed;

    this.currentAttackDuration = duration;

    const hitDelay = duration * attack.hitTimeRatio;

    this.playAttackAnimation(attack, duration);

    // Schedule attack action
    this.hitTimerEvent = this.owner.scene.time.delayedCall(hitDelay, () => {
      this.hitTimerEvent = null;

      if (!this.owner.active) return;
      if (!this.currentAttack) return;

      if (attack.type === "ranged") {
        this.fireArrow(attack, input);
      } else {
        this.createHitbox(attack);
      }
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

    // cancel lunge
    this.lungeTimer = 0;
    this.lungeVelocity.set(0, 0);

    // Stop attack movement
    this.owner.setVelocity(0, 0);

    // stop attack animation
    this.owner.anims.stop();

    this.currentAttack = null;
    this.attackTimer = 0;

    // reset Animation
    this.owner.anims.timeScale = 1;
  }

  finishCurrentAttack() {
    this.owner.anims.timeScale = 1;

    if (this.currentAttack.type === "melee" && this.comboQueued && this.comboIndex < meleeCombo.length - 1) {
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
    this.rangedAim = null;
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

  updateRangedFacing() {
    const body = this.owner.body;
    const aim = this.rangedAim;

    let targetX = aim?.targetX;
    let targetY = aim?.targetY;

    if (aim?.target?.active && aim.target.body?.enable) {
      targetX = aim.target.body.center.x;
      targetY = aim.target.body.center.y;
    }

    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
      return;
    }

    const dx = targetX - body.center.x;
    const dy = targetY - body.center.y;

    if (dx === 0 && dy === 0) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.owner.movement.facing = dx > 0 ? "right" : "left";
    } else {
      this.owner.movement.facing = dy > 0 ? "down" : "up";
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

      const isCritical = Math.random() < this.owner.stats.critChance;

      let damage = this.owner.stats.damage * attack.damageMultiplier;

      if (isCritical) {
        damage *= this.owner.stats.critDamage;
      }

      enemy.takeDamage(damage, {
        direction: this.owner.movement.facing,
        force: attack.flinch?.force ?? 140,
        flinchDuration: attack.flinch?.duration ?? 200,
        isCritical,
      });
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

  fireArrow(attack) {
    const body = this.owner.body;
    const scene = this.owner.scene;
    const aim = this.rangedAim;

    let targetX = aim?.targetX;
    let targetY = aim?.targetY;

    // Use the enemy's current body center.
    if (aim?.target?.active && aim.target.body?.enable) {
      targetX = aim.target.body.center.x;
      targetY = aim.target.body.center.y;
    }

    // Calculate the actual arrow origin (the bow position).
    const arrowOriginOffsetY = -22;
    const originX = body.center.x;
    const originY = body.center.y + arrowOriginOffsetY;

    // Calculate direction from the arrow origin to the target.
    let dx = targetX - originX;
    let dy = targetY - originY;

    // Fallback to the player's facing direction.
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) {
      const directions = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      };

      const direction = directions[this.owner.movement.facing];

      dx = direction.x;
      dy = direction.y;
    }

    const length = Math.hypot(dx, dy);

    const directionX = dx / length;
    const directionY = dy / length;

    const angle = Math.atan2(directionY, directionX);

    // Move the arrow slightly forward from the bow.
    const offset = 16;

    const x = originX + directionX * offset;
    const y = originY + directionY * offset;

    const facing = Math.abs(directionX) > Math.abs(directionY) ? (directionX > 0 ? "right" : "left") : directionY > 0 ? "down" : "up";

    // Keep the player's facing synchronized with the arrow.
    this.owner.movement.facing = facing;

    let damage = this.owner.stats.damage * attack.damageMultiplier;

    const isCritical = Math.random() < this.owner.stats.critChance;

    if (isCritical) {
      damage *= this.owner.stats.critDamage;
    }

    const projectile = new ArrowProjectile(scene, x, y, angle, damage, "player", {
      direction: facing,
      force: 140,
      flinchDuration: 200,
      isCritical,
    });

    scene.projectiles.add(projectile);
  }

  getNearestEnemy(range) {
    const enemies = this.owner.scene.combatSystem.enemies.getChildren();

    const playerX = this.owner.body.center.x;
    const playerY = this.owner.body.center.y;

    let nearestEnemy = null;
    let nearestDistance = range;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.body?.enable) continue;
      if (enemy.health?.isDead) continue;

      const dx = enemy.body.center.x - playerX;
      const dy = enemy.body.center.y - playerY;

      const distance = Math.hypot(dx, dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }

    return nearestEnemy;
  }

  startLunge(lunge) {
    console.log("start lunge");
    const direction = this.owner.movement.facing;

    let x = 0;
    let y = 0;

    switch (direction) {
      case "up":
        y = -1;
        break;
      case "down":
        y = 1;
        break;
      case "left":
        x = -1;
        break;
      case "right":
        x = 1;
        break;
    }

    this.lungeTimer = lunge.duration;
    this.lungeVelocity.set(x * lunge.speed, y * lunge.speed);

    this.owner.setVelocity(this.lungeVelocity.x, this.lungeVelocity.y);
  }

  updateLunge(delta) {
    if (this.lungeTimer <= 0) return;

    const body = this.owner.body;

    // Stop only the axis that is blocked.
    // Stop only the axis that is blocked.
    if (body.blocked.left || body.blocked.right) {
      this.lungeVelocity.x = 0;
    }

    if (body.blocked.up || body.blocked.down) {
      this.lungeVelocity.y = 0;
    }

    this.owner.setVelocity(this.lungeVelocity.x, this.lungeVelocity.y);

    this.lungeTimer -= delta;

    if (this.lungeTimer <= 0) {
      this.lungeTimer = 0;
      this.lungeVelocity.set(0, 0);

      this.owner.movement.stop();
    }
  }

  update(input, delta) {
    if (!this.currentAttack) return;

    // Update lunge
    this.updateLunge(delta);

    this.attackTimer -= delta;

    const duration = this.currentAttackDuration;

    const comboWindowStart = duration * (this.currentAttack.comboWindowStartRatio ?? 0.5);

    if (!this.comboWindowOpen && this.attackTimer <= duration - comboWindowStart) {
      this.comboWindowOpen = true;
    }

    if (this.comboWindowOpen && input.attackReleased) {
      this.comboQueued = true;
    }

    if (this.attackTimer <= 0) {
      this.comboWindowOpen = false;
      this.finishCurrentAttack();
    }
  }
}
