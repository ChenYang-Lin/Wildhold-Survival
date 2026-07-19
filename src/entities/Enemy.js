import CombatComponent from "../components/CombatComponent.js";
import EnemyAIComponent from "../components/EnemyAIComponent.js";
import HealthBarComponent from "../components/HealthBarComponent.js";
import HealthComponent from "../components/HealthComponent.js";

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, stats = {}, campNode) {
    super(scene, x, y, "goblin", "goblin_idle_down");
    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(20, 16);
    this.body.setOffset(86, 112); // 192 x 192, 32 + 32 + 16 + 6, 32 + 32 + 16 + 16 + 32

    this.facing = "down";

    this.health = new HealthComponent(this, stats.hp ?? 3);
    this.healthBar = new HealthBarComponent(this);

    this.combat = new CombatComponent(this);

    this.aggroRange = 200;

    this.speed = stats.speed ?? 50;

    this.ai = new EnemyAIComponent(this, campNode);

    // Spawn location
    this.spawnX = x;
    this.spawnY = y;

    // AI
    this.STATE_NAVIGATE = "navigate";
    this.STATE_BREAK_OBSTACLE = "break_obstacle";
    this.STATE_CHASE = "chase";
    this.STATE_WINDUP = "windup";
    this.STATE_ATTACK = "attack";
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

  updateFacing() {
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;

    if (Math.abs(vx) > Math.abs(vy)) {
      this.facing = vx > 0 ? "right" : "left";
    } else {
      this.facing = vy > 0 ? "down" : "up";
    }
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
    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ff4444"); // prettier-ignore

    this.health.takeDamage(amount);
    this.healthBar.update();
  }

  moveTowards(position) {
    this.scene.physics.moveTo(this, position.x, position.y, this.speed);

    this.updateFacing();
    this.anims.play(`goblin_walk_${this.facing}`, true);
  }

  die() {
    this.healthBar.destroy();
    this.destroy();
  }

  // Enemy die instantly on retreat (temporary function, might change retreat function)
  retreatEnemies() {
    const enemies = this.scene.combatSystem.getEnemies().getChildren();

    enemies.forEach((enemy) => {
      enemy.enterDead();
    });
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

  enterWindup() {
    if (this.aiState === this.STATE_WINDUP) return;

    this.aiState = this.STATE_WINDUP;

    this.stopMoving();

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
    this.aiState = this.STATE_ATTACK;

    this.stopMoving();

    if (!this.combat.canAttack) {
      return;
    }

    if (this.active) {
      if (this.aiState === this.STATE_DEAD) return;
      this.combat.performAttack({
        onRecover: () => {
          this.enterChase();
        },
      });
      this.anims.play(`goblin_attack_${this.facing}`);
    }
  }

  enterDead() {
    if (this.aiState === this.STATE_DEAD) return;

    this.aiState = this.STATE_DEAD;

    this.stopMoving();

    this.anims.play(`goblin_death`);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.die();
    });
  }

  enterRetreat() {
    this.retreatEnemies(); // temperary solution, might change the way enemy retreat;
    return;
    this.aiState = this.STATE_RETREAT;

    this.retreatDirection = Phaser.Math.Angle.Between(this.x, this.y, this.spawnX, this.spawnY);
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

    this.anims.play(`goblin_idle_${this.facing}`, true);
  }

  updateAttack() {
    this.stopMoving();
  }

  updateRetreat() {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY);

    if (dist < 20) {
      this.die();
      return;
    }

    this.scene.physics.moveTo(this, this.spawnX, this.spawnY, this.speed * 1.5);

    if (this.body.blocked.left || this.body.blocked.right || this.body.blocked.up || this.body.blocked.down) {
      this.retreatDirection += Phaser.Math.FloatBetween(-1, 1);
    }

    this.scene.physics.velocityFromRotation(this.retreatDirection, this.speed * 1.5, this.body.velocity);

    this.updateFacing();
    this.anims.play(`goblin_walk_${this.facing}`, true);
  }

  update(time) {
    if (!this.active) return;
    if (this.aiState === this.STATE_DEAD) return;

    this.setDepth(this.body.center.y);

    switch (this.aiState) {
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
}
