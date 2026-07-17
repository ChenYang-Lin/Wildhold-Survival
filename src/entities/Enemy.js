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
    this.hp = stats.hp ?? 3;
    this.maxHP = this.hp;
    this.speed = stats.speed ?? 100;

    // Attack
    this.attackRange = 46;
    this.aggroRange = 200;
    this.attackDamage = stats.damage ?? 1;
    this.attackCooldown = 1000;
    this.canAttack = true;

    this.target = null;
    this.currentNode = campNode;
    this.targetNode = this.scene.navigationManager.chooseNextNode(this.currentNode);
    this.drawDebugTargetNode();

    this.path = [];
    this.followingPath = false;
    this.currentWaypoint = 0;
    this.pathRecalculateCooldown = 0;

    this.pathCooldown = 0;
    this.pathInterval = 500; // ms

    // Spawn location
    this.spawnX = x;
    this.spawnY = y;

    // HP UI
    this.hpBar = this.scene.add.graphics();
    this.hpBar.setDepth(5000);

    // AI
    this.STATE_NAVIGATE = "navigate";
    this.STATE_CHASE = "chase";
    this.STATE_WINDUP = "windup";
    this.STATE_ATTACK = "attack";
    this.STATE_RETREAT = "retreat";
    this.STATE_DEAD = "dead";

    this.enterNavigate();
  }

  static preload(scene) {
    scene.load.atlas("goblin", "assets/enemy/goblin.png", "assets/enemy/goblin_atlas.json");

    scene.load.animation("goblin_anim", "assets/enemy/goblin_anim.json");
  }

  drawDebugTargetNode() {
    // this.scene.add.circle(this.targetNode.x, this.targetNode.y, 6, 0xff0000);
  }

  // Similar to setPosition(targetX, targetY). But instead of moving sprite's center to target location, it moves the sprite's body.center to the target location
  setBodyCenterPosition(targetX, targetY) {
    const x = targetX - this.body.offset.x + this.width / 2 - this.body.width / 2;
    const y = targetY - this.body.offset.y + this.height / 2 - this.body.height / 2;

    this.setPosition(x, y);
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

  lookForTargets() {
    // Is target nearby
    const tower = this.scene.buildingManager.getNearestTower(this.body.center.x, this.body.center.y, 150); // prettier-ignore

    if (this.distanceTo(tower) < this.aggroRange) {
      this.target = tower;
      this.enterChase();
      return;
    }

    // Is player nearby
    const player = this.scene.player;

    if (this.distanceTo(player) < this.aggroRange) {
      this.target = player;
      this.enterChase();
      return;
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

  arriveAtNode() {
    this.currentNode = this.targetNode;

    this.targetNode = this.scene.navigationManager.chooseNextNode(this.currentNode);

    this.path.length = 0;
    this.followingPath = false;
    this.currentWaypoint = 0;

    this.pathCooldown = 0;
  }

  followPath() {
    if (this.path.length === 0) {
      this.setVelocity(0);
      return;
    }

    const waypoint = this.path[this.currentWaypoint];

    if (!waypoint) {
      this.arriveAtNode();

      return;
    }

    const world = this.scene.mapManager.gridToWorld(waypoint.gridX, waypoint.gridY);

    const targetX = world.x + this.scene.mapManager.map.tileWidth / 2;
    const targetY = world.y + this.scene.mapManager.map.tileHeight / 2;

    const distance = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, targetX, targetY);

    const arriveDistance = (this.speed * this.scene.game.loop.delta) / 1000 + 2;

    if (distance < arriveDistance) {
      this.currentWaypoint++;
      this.setVelocity(0);

      return;
    }

    // Move the enemy
    let vx = targetX - this.body.center.x;
    let vy = targetY - this.body.center.y;

    const length = Math.hypot(vx, vy);

    if (length <= 0.001) {
      this.setVelocity(0);
      return;
    }

    vx = (vx / length) * this.speed;
    vy = (vy / length) * this.speed;

    this.setVelocity(vx, vy);

    this.updateFacing();
    this.anims.play(`goblin_walk_${this.facing}`, true);
  }

  updatePath(time) {
    if (!this.targetNode) return;

    if (this.followingPath) return;
    this.followingPath = true;

    if (time < this.pathCooldown) return;

    const start = this.scene.mapManager.worldToGrid(this.body.center.x, this.body.center.y);

    const end = this.scene.mapManager.worldToGrid(this.targetNode.x, this.targetNode.y);

    const newPath = this.scene.pathfindingManager.findPath(start.gridX, start.gridY, end.gridX, end.gridY);

    console.log(newPath);
    if (newPath.length > 0) {
      this.path = newPath;
      this.currentWaypoint = 0;
    }

    this.pathCooldown = time + this.pathInterval;
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

  enterNavigate() {
    if (this.aiState === this.STATE_NAVIGATE) return;

    this.aiState = this.STATE_NAVIGATE;

    this.target = null;
  }

  enterChase() {
    this.aiState = this.STATE_CHASE;
    this.followingPath = false;
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

  updateNavigate(time) {
    this.updatePath();
    this.followPath();

    // Target detection
    this.lookForTargets();
  }

  updateChase() {
    if (!this.target) return;

    if (this.distanceTo(this.target) > this.aggroRange) {
      this.enterNavigate();
      return;
    }

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

  update(time) {
    if (!this.active) return;
    if (this.aiState === this.STATE_DEAD) return;

    this.setDepth(this.body.center.y);

    switch (this.aiState) {
      case this.STATE_NAVIGATE:
        this.updateNavigate(time);
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

      case this.STATE_DEAD:
        break;
    }

    this.drawHealthBar();
  }
}
