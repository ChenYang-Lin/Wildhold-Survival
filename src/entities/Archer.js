import EnemyProjetile from "./EnemyProjectile.js";

export default class Archer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, "goblin_archer", "goblin_archer_idle_down");
    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(32, 32);
    this.body.setOffset(80, 96); // 192 x 192, 32 + 32 + 16, 32 + 32 + 16 + 16

    this.facing = "down";
    this.hp = stats.hp ?? 2;
    this.maxHP = this.hp;
    this.speed = stats.speed ?? 40;

    // Attack
    this.attackRange = 180;
    this.attackDamage = stats.damage ?? 1;
    this.attackCooldown = 2000;
    this.canAttack = true;

    this.target = null;

    // Spawn location
    this.spawnX = x;
    this.spawnY = y;

    // HP UI
    this.hpBar = this.scene.add.graphics();
    this.hpBar.setDepth(5000);

    // AI
    this.aiState = "chase";

    this.STATE_CHASE = "chase";
    this.STATE_WINDUP = "windup";
    this.STATE_ATTACK = "attack";
    this.STATE_RETREAT = "retreat";
    this.STATE_DEAD = "dead";
  }

  static preload(scene) {
    scene.load.atlas(
      "goblin_archer",
      "assets/enemy/goblin_archer.png",
      "assets/enemy/goblin_archer_atlas.json",
    );

    scene.load.animation(
      "goblin_archer_anim",
      "assets/enemy/goblin_archer_anim.json",
    );
  }

  drawHealthBar() {
    if (!this.active) return;
    this.hpBar.clear();

    const percent = this.hp / this.maxHP;

    const x = this.body.center.x - 16;
    const y = this.body.center.y - 40;

    this.hpBar.fillStyle(0x222222);
    this.hpBar.fillRect(x, y, 32, 4);

    this.hpBar.fillStyle(0xff0000);
    this.hpBar.fillRect(x, y, 32 * percent, 4);
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

  // check if target in attack range
  canAttackTarget() {
    return (
      this.target && this.distanceToTarget(this.target) <= this.attackRange
    );
  }

  distanceToTarget(target) {
    if (!this.active) return;

    if (!target) return Infinity;

    return Phaser.Math.Distance.Between(
      this.body.center.x,
      this.body.center.y,
      target.body.center.x,
      target.body.center.y,
    );
  }

  findNearbyBuilding() {
    let nearest = null;
    let nearestDist = Infinity;

    this.scene.buildingManager.buildings.children.iterate((building) => {
      if (!building || !building.active) return;

      const dist = Phaser.Math.Distance.Between(
        this.body.center.x,
        this.body.center.y,
        building.body.center.x,
        building.body.center.y,
      );

      if (dist < 80 && dist < nearestDist) {
        nearest = building;
        nearestDist = dist;
      }
    });

    return nearest;
  }

  startAttackCooldown() {
    this.canAttack = false;

    this.scene.time.delayedCall(this.attackCooldown, () => {
      if (this.active) {
        this.canAttack = true;
      }
    });
  }

  takeDamage(amount) {
    this.hp -= amount;

    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ff4444"); // prettier-ignore

    if (this.hp <= 0) {
      this.enterDead();
    }
  }

  die() {
    this.hpBar.destroy();
    this.destroy();
  }

  // Enemy die instantly on retreat (temporary function, might change retreat function)
  retreatEnemies() {
    const enemies = this.scene.combatSystem.getEnemies().getChildren();

    enemies.forEach((enemy) => {
      enemy.enterDead();
    });
  }

  shootArrow() {
    const projectile = new EnemyProjetile(this.scene, this.body.center.x, this.body.center.y, this.target, this.attackDamage); // prettier-ignore

    this.scene.enemyProjectiles.add(projectile);
  }

  performAttack() {
    this.startAttackCooldown();

    this.scene.time.delayedCall(800, () => {
      if (!this.active) return;
      if (this.aiState === this.STATE_DEAD) return;

      if (!this.target) return;

      if (!this.canAttackTarget()) {
        return;
      }

      this.shootArrow();
    });

    this.scene.time.delayedCall(800, () => {
      if (!this.active) return;
      if (this.aiState === this.STATE_DEAD) return;

      this.enterChase();
    });
  }

  updateTarget() {
    if (
      this.target &&
      this.target.active === true &&
      this.target !== this.scene.player &&
      this.target !== this.scene.campfire
    ) {
      return;
    }

    const player = this.scene.player;

    const distToPlayer = this.distanceToTarget(player);

    if (distToPlayer < 200) {
      this.target = player;
    } else {
      this.target = this.scene.campfire;
    }
  }

  enterChase() {
    this.aiState = this.STATE_CHASE;
  }

  enterWindup() {
    if (this.aiState === this.STATE_WINDUP) return;

    this.aiState = this.STATE_WINDUP;

    this.setVelocity(0, 0);

    this.scene.time.delayedCall(500, () => {
      if (!this.active) return;

      if (this.aiState === this.STATE_DEAD) return;

      if (this.aiState !== this.STATE_WINDUP) return;

      this.enterAttack();
    });
  }

  enterAttack() {
    this.aiState = this.STATE_ATTACK;

    this.setVelocity(0, 0);

    if (!this.canAttack) {
      this.aiState = this.STATE_CHASE;
      return;
    }

    if (this.active) {
      if (this.aiState === this.STATE_DEAD) return;
      this.performAttack();
      this.anims.play(`goblin_archer_attack_${this.facing}`);
    }
  }

  enterDead() {
    if (this.aiState === this.STATE_DEAD) return;

    this.aiState = this.STATE_DEAD;

    this.setVelocity(0, 0);

    this.hpBar.destroy();

    this.anims.play(`goblin_archer_death`);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.die();
    });
  }

  enterRetreat() {
    this.retreatEnemies(); // temperary solution, might change the way enemy retreat;
    return;
    this.aiState = this.STATE_RETREAT;

    this.retreatDirection = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.spawnX,
      this.spawnY,
    );
  }

  updateChase() {
    if (!this.target) return;

    this.scene.physics.moveToObject(this, this.target, this.speed);
    this.updateFacing();
    this.anims.play(`goblin_archer_walk_${this.facing}`, true);

    if (
      this.body.blocked.left ||
      this.body.blocked.right ||
      this.body.blocked.up ||
      this.body.blocked.down
    ) {
      const blockingBuilding = this.findNearbyBuilding();
      if (blockingBuilding) {
        this.target = blockingBuilding;
        this.enterWindup();
        return;
      }
    }

    if (this.target && this.canAttackTarget()) {
      this.enterWindup();
    }
  }

  updateWindup() {
    this.setVelocity(0, 0);

    this.anims.play(`goblin_archer_idle_${this.facing}`, true);
  }

  updateAttack() {
    this.setVelocity(0, 0);
  }

  updateRetreat() {
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.spawnX,
      this.spawnY,
    );

    if (dist < 20) {
      this.die();
      return;
    }

    this.scene.physics.moveTo(this, this.spawnX, this.spawnY, this.speed * 1.5);

    if (
      this.body.blocked.left ||
      this.body.blocked.right ||
      this.body.blocked.up ||
      this.body.blocked.down
    ) {
      this.retreatDirection += Phaser.Math.FloatBetween(-1, 1);
    }

    this.scene.physics.velocityFromRotation(
      this.retreatDirection,
      this.speed * 1.5,
      this.body.velocity,
    );

    this.updateFacing();
    this.anims.play(`goblin_archer_walk_${this.facing}`, true);
  }

  update() {
    if (!this.active) return;

    if (this.aiState === this.STATE_DEAD) return;

    this.setDepth(this.body.center.y);

    this.updateTarget();

    switch (this.aiState) {
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

    this.drawHealthBar();
  }
}
