import CombatComponent from "../components/CombatComponent.js";
import EnemyAIComponent from "../components/EnemyAIComponent.js";
import HealthBarComponent from "../components/HealthBarComponent.js";
import HealthComponent from "../components/HealthComponent.js";
import StatsComponent from "../components/StatsComponent.js";

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, frame, stats = {}, campNode) {
    super(scene, x, y, texture, frame);
    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.facing = "down";
    this.aggroRange = 200;
    this.flinchTimer = 0;

    // Components
    this.health = new HealthComponent(this, stats.maxHP ?? 3);
    this.healthBar = new HealthBarComponent(this);
    this.combat = new CombatComponent(this, stats);
    this.ai = new EnemyAIComponent(this, campNode);
    this.stats = new StatsComponent(this, {
      speed: stats.speed,
      damage: stats.attackDamage,
      attackCooldown: stats.attackCooldown,
    });

    // Spawn location
    this.spawnX = x;
    this.spawnY = y;

    // AI
    this.STATE_NAVIGATE = "navigate";
    this.STATE_BREAK_OBSTACLE = "break_obstacle";
    this.STATE_CHASE = "chase";
    this.STATE_WINDUP = "windup";
    this.STATE_ATTACK = "attack";
    this.STATE_FLINCH = "flinch";
    this.STATE_RETREAT = "retreat";
    this.STATE_DEAD = "dead";

    this.aiState = null;
    this.enterNavigate();
  }

  static preload(scene) {
    scene.load.atlas("goblin", "assets/enemy/goblin.png", "assets/enemy/goblin_atlas.json");

    scene.load.animation("goblin_anim", "assets/enemy/goblin_anim.json");
  }

  // Similar to setPosition(targetX, targetY). But instead of moving sprite's center to target location, it moves the sprite's body.center to the target location
  setBodyCenterPosition(targetX, targetY) {
    const x = targetX - this.body.offset.x + this.width / 2 - this.body.width / 2;
    const y = targetY - this.body.offset.y + this.height / 2 - this.body.height / 2;

    this.setPosition(x, y);
  }

  moveBodyCenterTowards(targetX, targetY) {
    let vx = targetX - this.body.center.x;
    let vy = targetY - this.body.center.y;

    const length = Math.hypot(vx, vy);

    if (length <= 0.001) {
      this.stopMoving();
      return;
    }

    vx = (vx / length) * this.stats.speed;
    vy = (vy / length) * this.stats.speed;

    this.setVelocity(vx, vy);

    this.updateFacing();
    this.anims.play(`${this.type}_walk_${this.facing}`, true);
  }

  updateFacing() {
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;

    // ignore tiny velocities
    if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) return;

    if (Math.abs(vx) > Math.abs(vy)) {
      this.facing = vx > 0 ? "right" : "left";
    } else {
      this.facing = vy > 0 ? "down" : "up";
    }
  }

  faceTarget(target) {
    if (!target) return;

    const dx = target.body.center.x - this.body.center.x;
    const dy = target.body.center.y - this.body.center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? "right" : "left";
    } else {
      this.facing = dy > 0 ? "down" : "up";
    }
  }

  isActionLocked() {
    return false;
  }

  distanceTo(target) {
    if (!this.active) return;

    if (!target) return Infinity;

    const pos = this.getPosition(target);

    return Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, pos.x, pos.y);
  }

  getPosition(target) {
    if (target.body) {
      return target.body.center;
    }

    return target;
  }

  stopMoving() {
    this.setVelocity(0, 0);
  }

  takeDamage(amount) {
    if (this.aiState === this.STATE_DEAD) return;

    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ff4444"); // prettier-ignore

    this.health.takeDamage(amount);
    this.healthBar.update();

    if (this.health.isDead) {
      this.enterDead();
    }
  }

  attack() {
    // Override in subclasses.
  }

  die() {
    this.stopMoving();

    this.healthBar.destroy();
    this.destroy();
  }

  // Enemy die instantly on retreat (temporary function, might change retreat function)
  retreat() {
    this.enterDead();
  }

  enterIdle() {
    if (this.aiState === this.STATE_IDLE) return;

    this.aiState = this.STATE_IDLE;

    this.stopMoving();

    this.anims.play(`${this.type}_idle_${this.facing}`);
  }

  enterNavigate() {
    if (this.aiState === this.STATE_NAVIGATE) return;

    this.aiState = this.STATE_NAVIGATE;

    this.ai.currentTarget = null;
    this.ai.obstacleTile = null;
    this.ai.path.length = 0;
  }

  enterBreakObstacle() {
    if (this.aiState === this.STATE_BREAK_OBSTACLE) return;

    this.aiState = this.STATE_BREAK_OBSTACLE;

    this.ai.path.length = 0;
  }

  enterChase() {
    this.aiState = this.STATE_CHASE;
  }

  enterWindup(target) {
    if (this.aiState === this.STATE_WINDUP) return;

    this.aiState = this.STATE_WINDUP;
    this.faceTarget(target);

    if (!this.combat.canAttack) {
      this.enterChase();
      return;
    }

    this.stopMoving();

    this.anims.play(`${this.type}_idle_${this.facing}`);

    this.combat.startAttackSequence({
      onWindupComplete: () => {
        if (!this.active) return;

        if (this.aiState === this.STATE_DEAD) return;

        if (this.aiState !== this.STATE_WINDUP) return;

        this.enterAttack();
      },
    });
  }

  enterAttack() {
    if (!this.active) return;
    if (this.aiState === this.STATE_DEAD) return;

    this.aiState = this.STATE_ATTACK;

    this.stopMoving();

    this.combat.performAttack({
      onRecover: () => {
        if (!this.active) return;
        if (this.aiState === this.STATE_DEAD) return;

        this.enterChase();
      },
    });
    this.anims.play(`${this.type}_attack_${this.facing}`);
  }

  enterFlinch(duration = 200, direction = null, force = 140) {
    if (!this.active) return;
    if (this.aiState === this.STATE_DEAD) return;

    this.aiState = this.STATE_FLINCH;
    this.flinchTimer = duration;

    this.combat.cancelAttack?.();
    this.cancelSpecialAction?.();

    if (direction) {
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

      this.setVelocity(x * force, y * force);
    }

    this.setTintFill(0xffffff);

    this.scene.time.delayedCall(60, () => {
      if (!this.active) return;
      if (this.aiState === this.STATE_DEAD) return;

      this.clearTint();
    });

    this.anims.play(`${this.type}_idle_${this.facing}`);
  }

  enterDead() {
    if (this.aiState === this.STATE_DEAD) return;

    this.aiState = this.STATE_DEAD;

    // Stop physics movement
    this.stopMoving();

    this.anims.play(`${this.type}_death`);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.die();
    });
  }

  enterRetreat() {
    this.retreat(); // temperary solution, might change the way enemy retreat;
    return;
    this.aiState = this.STATE_RETREAT;

    this.retreatDirection = Phaser.Math.Angle.Between(this.x, this.y, this.spawnX, this.spawnY);
  }

  updateIdle() {
    if (this.ai.hasValidTarget()) {
      this.enterChase();
      return;
    }

    this.enterNavigate();
  }

  updateNavigate(time) {
    this.ai.updatePath(time);
    this.ai.followPath();

    // Target detection
    if (this.ai.tryAcquireTarget()) {
      this.enterChase();
    }
  }

  updateBreakObstacle(time) {
    this.ai.updateBreakObstacle(time);
  }

  updateChase() {
    this.ai.updateChase();
  }

  updateWindup() {
    this.stopMoving();
  }

  updateAttack() {
    this.stopMoving();
  }

  updateFlinch(delta) {
    this.flinchTimer -= delta;

    const decay = 0.92;

    this.setVelocity(this.body.velocity.x * decay, this.body.velocity.y * decay);

    if (this.flinchTimer <= 0) {
      this.flinchTimer = 0;

      this.stopMoving();
      this.enterIdle();
    }
  }

  updateRetreat() {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY);

    if (dist < 20) {
      this.die();
      return;
    }

    this.scene.physics.moveTo(this, this.spawnX, this.spawnY, this.stats.speed * 1.5);

    if (this.body.blocked.left || this.body.blocked.right || this.body.blocked.up || this.body.blocked.down) {
      this.retreatDirection += Phaser.Math.FloatBetween(-1, 1);
    }

    this.scene.physics.velocityFromRotation(this.retreatDirection, this.stats.speed * 1.5, this.body.velocity);

    this.updateFacing();
    this.anims.play(`${this.type}_walk_${this.facing}`, true);
  }

  update(time, delta) {
    if (!this.active) return;
    if (this.aiState === this.STATE_DEAD) return;

    if (this.aiState === this.STATE_FLINCH) {
      this.updateFlinch(delta);
    } else if (!this.isActionLocked?.()) {
      switch (this.aiState) {
        case this.STATE_IDLE:
          this.updateIdle();
          break;

        case this.STATE_NAVIGATE:
          this.updateNavigate(time);
          break;

        case this.STATE_BREAK_OBSTACLE:
          this.updateBreakObstacle(time);
          break;

        case this.STATE_CHASE:
          this.updateChase();
          break;

        case this.STATE_WINDUP:
          this.updateWindup();
          break;

        case this.STATE_ATTACK:
          this.updateAttack();
          break;

        case this.STATE_RETREAT:
          this.updateRetreat();
          break;
      }
    }

    this.setDepth(this.body.center.y);
    this.healthBar.update();
    this.castBar?.update(delta);
  }
}
