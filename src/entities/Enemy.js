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

    this.speed = stats.speed ?? 50;

    // Attack
    this.attackRange = 32;
    this.aggroRange = 200;
    this.attackDamage = stats.damage ?? 1;
    this.attackCooldown = 1000;
    this.canAttack = true;

    this.windupDuration = 500;
    this.hitboxLifetime = 80;
    this.attackDelay = 500;
    this.attackRecoverDuration = 800;

    this.target = null;
    this.currentNode = campNode;
    this.targetNode = this.scene.navigationManager.chooseNextNode(this.currentNode);
    this.idealPathLength = 0;
    this.maxDetour = 10;
    this.drawDebugTargetNode();

    this.path = [];
    this.currentWaypoint = 0;

    this.pathCooldown = 0;
    this.pathInterval = 500; // ms

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

  drawDebugTargetNode() {
    // this.scene.add.circle(this.targetNode.x, this.targetNode.y, 6, 0xff0000);
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

  // check if target in attack range
  isTargetInAttackRange() {
    return this.target && this.distanceTo(this.target) - this.target.body.width / 2 <= this.attackRange;
  }

  // get the position of the obstacle(building) that is blocking the enemy path.
  getObstaclePosition() {
    const world = this.scene.mapManager.gridToWorld(this.obstacleTile.gridX, this.obstacleTile.gridY);

    return {
      x: world.x + this.scene.mapManager.map.tileWidth / 2,
      y: world.y + this.scene.mapManager.map.tileHeight / 2,
    };
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

  startAttackCooldown() {
    this.canAttack = false;

    this.scene.time.delayedCall(this.attackCooldown, () => {
      if (this.active) {
        this.canAttack = true;
      }
    });
  }

  takeDamage(amount) {
    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ff4444"); // prettier-ignore

    this.health.takeDamage(amount);
    this.healthBar.update();
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
    this.scene.time.delayedCall(this.hitboxLifetime, () => {
      hitbox.destroy();
    });
  }

  moveTowards(position) {
    this.scene.physics.moveTo(this, position.x, position.y, this.speed);

    this.updateFacing();
    this.anims.play(`goblin_walk_${this.facing}`, true);
  }

  chooseObstacleToAttack(normalPath) {
    console.log("choosing obstacle to attack!");
    for (const tile of normalPath) {
      if (this.scene.mapManager.isTileOccupied(tile.gridX, tile.gridY)) {
        const building = this.scene.buildingManager.getBuildingAtGrid(tile.gridX, tile.gridY);
        console.log(building);
        if (building) {
          this.target = building;
          this.obstacleTile = tile;
          this.enterBreakObstacle();
          return;
        }
      }
    }
  }

  findHighestPriorityTarget() {
    // Is target nearby
    const tower = this.scene.buildingManager.getNearestTower(this.body.center.x, this.body.center.y, 150); // prettier-ignore

    if (tower && this.distanceTo(tower) < this.aggroRange) {
      return tower;
    }

    // Is player nearby
    const player = this.scene.player;

    if (this.distanceTo(player) < this.aggroRange) {
      return player;
    }

    if (!this.targetNode) {
      return this.scene.campfire;
    }

    return null;
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

  arriveAtNode() {
    this.currentNode = this.targetNode;

    this.targetNode = this.scene.navigationManager.chooseNextNode(this.currentNode);

    this.path.length = 0;
    this.currentWaypoint = 0;

    this.pathCooldown = 0;
  }

  followPath() {
    if (this.path.length === 0) {
      this.stopMoving();
      return;
    }

    const waypoint = this.path[this.currentWaypoint];

    if (!waypoint) {
      this.arriveAtNode();

      return;
    }

    if (this.scene.mapManager.isTileBlocked(waypoint.gridX, waypoint.gridY)) {
      this.path.length = 0;
      return;
    }

    const world = this.scene.mapManager.gridToWorld(waypoint.gridX, waypoint.gridY);

    const targetX = world.x + this.scene.mapManager.map.tileWidth / 2;
    const targetY = world.y + this.scene.mapManager.map.tileHeight / 2;

    const distance = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, targetX, targetY);

    const arriveDistance = (this.speed * this.scene.game.loop.delta) / 1000 + 2;

    if (distance < arriveDistance) {
      this.currentWaypoint++;
      this.stopMoving();

      return;
    }

    // Move the enemy
    let vx = targetX - this.body.center.x;
    let vy = targetY - this.body.center.y;

    const length = Math.hypot(vx, vy);

    if (length <= 0.001) {
      this.stopMoving();
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

    if (this.path.length > 0) return;

    if (time < this.pathCooldown) return;

    const start = this.scene.mapManager.worldToGrid(this.body.center.x, this.body.center.y);

    const end = this.scene.mapManager.worldToGrid(this.targetNode.x, this.targetNode.y);

    const normalPath = this.scene.pathfindingManager.findPath(start.gridX, start.gridY, end.gridX, end.gridY, "ignoreBuildings");
    const path = this.scene.pathfindingManager.findPath(start.gridX, start.gridY, end.gridX, end.gridY, "enemy");

    if (path.length === 0) {
      this.chooseObstacleToAttack(normalPath);
      return;
    }

    this.idealPathLength = normalPath.length;
    const detour = path.length - this.idealPathLength;

    if (detour <= this.maxDetour) {
      this.path = path;
      this.currentWaypoint = 0;
    } else {
      this.chooseObstacleToAttack(normalPath);
    }

    this.pathCooldown = time + this.pathInterval;
  }

  performAttack() {
    this.startAttackCooldown();

    this.scene.time.delayedCall(this.attackDelay, () => {
      if (!this.active) return;
      if (this.aiState === this.STATE_DEAD) return;

      this.spawnAttackHitbox();
    });

    this.scene.time.delayedCall(this.attackRecoverDuration, () => {
      if (!this.active) return;
      if (this.aiState === this.STATE_DEAD) return;

      this.enterChase();
    });
  }

  enterNavigate() {
    if (this.aiState === this.STATE_NAVIGATE) return;

    this.aiState = this.STATE_NAVIGATE;

    this.target = null;
    this.obstacleTile = null;
    this.path.length = 0;
  }

  enterBreakObstacle() {
    if (this.aiState === this.STATE_BREAK_OBSTACLE) return;

    this.aiState = this.STATE_BREAK_OBSTACLE;

    this.path.length = 0;
  }

  enterChase() {
    this.aiState = this.STATE_CHASE;
  }

  enterWindup() {
    if (this.aiState === this.STATE_WINDUP) return;

    this.aiState = this.STATE_WINDUP;

    this.stopMoving();

    this.scene.time.delayedCall(this.windupDuration, () => {
      if (!this.active) return;

      if (this.aiState === this.STATE_DEAD) return;

      if (this.aiState !== this.STATE_WINDUP) return;

      this.enterAttack();
    });
  }

  enterAttack() {
    this.aiState = this.STATE_ATTACK;

    this.stopMoving();

    if (!this.canAttack) {
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
    this.updatePath(time);
    this.followPath();

    // Target detection
    const target = this.findHighestPriorityTarget();

    if (target) {
      this.target = target;
      this.enterChase();
    }
  }

  updateBreakObstacle(time) {
    if (!this.target || !this.target.active) {
      this.enterNavigate();
      return;
    }

    if (time > this.pathCooldown) {
      this.path.length = 0;

      this.updatePath(time);

      if (this.path.length > 0) {
        this.enterNavigate();
        return;
      }
    }

    const obstaclePos = this.getObstaclePosition();

    this.moveTowards(obstaclePos);

    if (Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, obstaclePos.x, obstaclePos.y) <= this.attackRange) {
      this.enterWindup();
    }
  }

  updateChase() {
    if (!this.target) return;

    if (this.target && this.distanceTo(this.target) > this.aggroRange) {
      this.enterNavigate();
      return;
    }

    this.moveTowards(this.getPosition(this.target));

    if (this.target && this.isTargetInAttackRange()) {
      // if the target is targetNode, then return
      if (this.target === this.targetNode) {
        return;
      }
      this.enterWindup();
    }
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
