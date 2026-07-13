export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, stats = {}, campNode) {
    super(scene, x, y, "goblin", "goblin_idle_down");
    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(32, 32);
    this.body.setOffset(80, 96); // 192 x 192, 32 + 32 + 16, 32 + 32 + 16 + 16

    this.facing = "down";
    this.hp = stats.hp ?? 3;
    this.maxHP = this.hp;
    this.speed = stats.speed ?? 50;

    // Attack
    this.attackRange = 46;
    this.attackDamage = stats.damage ?? 1;
    this.attackCooldown = 1000;
    this.canAttack = true;

    this.target = null;
    this.currentNode = campNode;
    this.targetNode = this.scene.navigationManager.chooseNextNode(this.currentNode);
    this.drawDebugTargetNode();

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
    scene.load.atlas("goblin", "assets/enemy/goblin.png", "assets/enemy/goblin_atlas.json");

    scene.load.animation("goblin_anim", "assets/enemy/goblin_anim.json");
  }

  drawDebugTargetNode() {
    // this.scene.add.circle(this.targetNode.x, this.targetNode.y, 6, 0xff0000);
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
  isTargetInAttackRange() {
    return this.target && this.distanceTo(this.target) <= this.attackRange;
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

  findNearbyBuilding() {
    let nearest = null;
    let nearestDist = Infinity;

    this.scene.buildingManager.buildings.children.iterate((building) => {
      if (!building || !building.active) return;

      const dist = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, building.body.center.x, building.body.center.y);

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

  spawnAttackHitbox() {
    let hitX = this.body.center.x;
    let hitY = this.body.center.y;

    let hitWidth = 32;
    let hitHeight = 32;

    switch (this.facing) {
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
      player.takeDamage(this.attackDamage, this);
    });

    // Buildings
    this.scene.physics.add.overlap(hitbox, this.scene.buildingManager.buildings, (_, building) => {
      if (hitTargets.has(building)) return;

      hitTargets.add(building);
      building.takeDamage(this.attackDamage, this);
    });

    // Campfire
    this.scene.physics.add.overlap(hitbox, this.scene.campfire, (_, campfire) => {
      if (hitTargets.has(campfire)) return;

      hitTargets.add(campfire);
      campfire.takeDamage(this.attackDamage, this);
    });

    // Destroy hitbox
    this.scene.time.delayedCall(80, () => {
      hitbox.destroy();
    });
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

  updateTarget() {
    // Keep attacking buildings
    if (this.target && this.target.active === true && this.target !== this.scene.player && this.target !== this.scene.campfire) {
      return;
    }

    const tower = this.scene.buildingManager.getNearestTower(this.body.center.x, this.body.center.y, 150); // prettier-ignore
    if (tower) {
      this.target = tower;
      return;
    }

    const player = this.scene.player;

    const distToPlayer = this.distanceTo(player);

    if (distToPlayer < 200) {
      this.target = player;
      return;
    }

    if (this.targetNode) {
      this.target = this.targetNode;
    } else {
      this.target = this.scene.campfire;
    }
  }

  performAttack() {
    this.startAttackCooldown();

    this.scene.time.delayedCall(500, () => {
      if (!this.active) return;
      if (this.aiState === this.STATE_DEAD) return;

      this.spawnAttackHitbox();
    });

    this.scene.time.delayedCall(800, () => {
      if (!this.active) return;
      if (this.aiState === this.STATE_DEAD) return;

      this.enterChase();
    });
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
      this.anims.play(`goblin_attack_${this.facing}`);
    }
  }

  enterDead() {
    if (this.aiState === this.STATE_DEAD) return;

    this.aiState = this.STATE_DEAD;

    this.setVelocity(0, 0);

    this.hpBar.destroy();

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

  updateChase() {
    if (!this.target) return;

    const pos = this.getPosition(this.target);
    this.scene.physics.moveTo(this, pos.x, pos.y, this.speed);

    this.updateFacing();
    this.anims.play(`goblin_walk_${this.facing}`, true);

    if (this.body.blocked.left || this.body.blocked.right || this.body.blocked.up || this.body.blocked.down) {
      const blockingBuilding = this.findNearbyBuilding();
      if (blockingBuilding) {
        this.target = blockingBuilding;
        this.enterWindup();
        return;
      }
    }

    if (this.target && this.isTargetInAttackRange()) {
      // if the target is targetNode, then return
      if (this.target === this.targetNode) {
        return;
      }
      this.enterWindup();
    }
  }

  updateWindup() {
    this.setVelocity(0, 0);

    this.anims.play(`goblin_idle_${this.facing}`, true);
  }

  updateAttack() {
    this.setVelocity(0, 0);
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

  update() {
    if (!this.active) return;

    if (this.aiState === this.STATE_DEAD) return;

    this.setDepth(this.body.center.y);

    // Choose next node when the enemy arrived the current target node.
    if (this.targetNode && this.scene.navigationManager.isAtNode(this, this.targetNode)) {
      this.currentNode = this.targetNode;

      this.targetNode = this.scene.navigationManager.chooseNextNode(this.currentNode);
      this.drawDebugTargetNode();
    }

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
