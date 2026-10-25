export default class EnemyAIComponent {
  constructor(owner, campNode) {
    this.owner = owner;
    this.scene = owner.scene;

    this.currentTarget = null;

    this.currentNode = campNode;
    this.targetNode = this.scene.navigationManager.chooseNextNode(campNode);

    this.path = [];
    this.currentWaypoint = 0;

    this.pathCooldown = 0;
    this.pathInterval = 500;

    this.idealPathLength = 0;
    this.maxDetour = 10;

    this.obstacleTile = null;

    this.targetMode = "default"; // For Quest/Tutorial; targeting the player during the tutorial

    this.playerPathTarget = null;
    // path finding when chasing the player
    this.pendingPlayerPathTarget = null;
  }

  hasValidTarget() {
    return this.currentTarget && this.currentTarget.active;
  }

  getAttackTarget() {
    return this.currentTarget;
  }

  isWaypointBlocked(gridX, gridY) {
    if (this.scene.buildingManager.getBuildingAtGrid(gridX, gridY)?.texture.key === "spike") {
      return false;
    }

    return this.scene.mapManager.isTileBlocked(gridX, gridY);
  }

  setTargetMode(mode) {
    this.targetMode = mode;

    if (mode === "player") {
      this.currentTarget = null;
      this.targetNode = null;
      this.path.length = 0;
      this.currentWaypoint = 0;
      this.obstacleTile = null;
      this.playerPathTarget = null;
      this.pathCooldown = 0;
      this.pendingPlayerPathTarget = null;
    }
  }

  updatePlayerPath(time) {
    const player = this.currentTarget;

    if (!player?.active) return;

    const playerTile = this.scene.mapManager.worldToGrid(player.body.center.x, player.body.center.y);

    const targetKey = `${playerTile.gridX},${playerTile.gridY}`;

    // Remember the latest player position, but don't interrupt
    // the enemy's current movement toward its waypoint.
    if (targetKey !== this.playerPathTarget) {
      this.pendingPlayerPathTarget = targetKey;
    }

    const shouldRetry = this.path.length === 0 && time >= this.pathCooldown;

    const targetChanged = this.pendingPlayerPathTarget !== null && this.pendingPlayerPathTarget !== this.playerPathTarget;

    if (!targetChanged && !shouldRetry) return;

    // Keep following the existing route until a waypoint is reached.
    if (this.path.length > 0) return;

    const start = this.scene.mapManager.worldToGrid(this.owner.body.center.x, this.owner.body.center.y);

    const path = this.scene.pathfindingManager.findPath(start.gridX, start.gridY, playerTile.gridX, playerTile.gridY, "enemy");

    this.playerPathTarget = targetKey;
    this.pendingPlayerPathTarget = null;
    this.pathCooldown = time + this.pathInterval;
    this.path = path;
    this.currentWaypoint = 0;
  }

  findHighestPriorityTarget() {
    const owner = this.owner;
    const player = this.scene.player;

    // Tutorial encounter: only target the player.
    if (this.targetMode === "player") {
      return player?.active ? player : null;
    }

    const tower = this.scene.buildingManager.getNearestTower(owner.body.center.x, owner.body.center.y, owner.aggroRange);

    if (tower && owner.distanceTo(tower) < owner.aggroRange) {
      return tower;
    }

    if (player && owner.distanceTo(player) < owner.aggroRange) {
      return player;
    }

    if (!this.targetNode) {
      return this.scene.campfire;
    }

    return null;
  }

  chooseObstacleToAttack(normalPath) {
    for (const tile of normalPath) {
      if (this.scene.mapManager.isTileOccupied(tile.gridX, tile.gridY)) {
        const building = this.scene.buildingManager.getBuildingAtGrid(tile.gridX, tile.gridY);

        if (building && building.texture.key !== "spike") {
          this.currentTarget = building;
          this.obstacleTile = tile;

          this.owner.enterBreakObstacle();

          return;
        }
      }
    }
  }

  // get the position of the obstacle(building) that is blocking the enemy path.
  getObstaclePosition() {
    const world = this.scene.mapManager.gridToWorld(this.obstacleTile.gridX, this.obstacleTile.gridY);

    return {
      x: world.x + this.scene.mapManager.map.tileWidth / 2,
      y: world.y + this.scene.mapManager.map.tileHeight / 2,
    };
  }

  arriveAtNode() {
    this.currentNode = this.targetNode;

    this.targetNode = this.scene.navigationManager.chooseNextNode(this.currentNode);

    this.path.length = 0;
    this.currentWaypoint = 0;

    this.pathCooldown = 0;
  }

  updatePath(time) {
    if (!this.targetNode) return;

    if (this.path.length > 0) return;

    if (time < this.pathCooldown) return;

    const start = this.scene.mapManager.worldToGrid(this.owner.body.center.x, this.owner.body.center.y);

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

  followPath() {
    if (this.path.length === 0) {
      this.owner.stopMoving();
      return;
    }

    const waypoint = this.path[this.currentWaypoint];

    if (!waypoint) {
      this.arriveAtNode();

      return;
    }

    if (this.isWaypointBlocked(waypoint.gridX, waypoint.gridY)) {
      this.path.length = 0;
      this.playerPathTarget = null;
      this.owner.stopMoving();

      if (this.owner.pendingSearch) {
        this.owner.enterSearching();
      }

      return;
    }

    const world = this.scene.mapManager.gridToWorld(waypoint.gridX, waypoint.gridY);

    const targetX = world.x + this.scene.mapManager.map.tileWidth / 2;
    const targetY = world.y + this.scene.mapManager.map.tileHeight / 2;

    const distance = Phaser.Math.Distance.Between(this.owner.body.center.x, this.owner.body.center.y, targetX, targetY);

    const arriveDistance = (this.owner.stats.speed * this.scene.game.loop.delta) / 1000 + 2;

    if (distance < arriveDistance) {
      this.currentWaypoint++;
      this.owner.stopMoving();

      return;
    }

    // Move the enemy
    let vx = targetX - this.owner.body.center.x;
    let vy = targetY - this.owner.body.center.y;

    const length = Math.hypot(vx, vy);

    if (length <= 0.001) {
      this.owner.stopMoving();
      return;
    }

    vx = (vx / length) * this.owner.stats.speed;
    vy = (vy / length) * this.owner.stats.speed;

    this.owner.setVelocity(vx, vy);

    this.owner.updateFacing();
    this.owner.anims.play(`${this.owner.type}_walk_${this.owner.facing}`, true);
  }

  followPlayerPath() {
    if (this.path.length === 0) {
      this.owner.stopMoving();

      if (this.owner.pendingSearch) {
        this.owner.enterSearching();
      }

      return;
    }

    const waypoint = this.path[this.currentWaypoint];

    if (!waypoint) {
      this.path.length = 0;
      this.owner.stopMoving();
      return;
    }

    if (this.isWaypointBlocked(waypoint.gridX, waypoint.gridY)) {
      this.path.length = 0;
      this.playerPathTarget = null;
      this.owner.stopMoving();

      if (this.owner.pendingSearch) {
        this.owner.enterSearching();
      }
      return;
    }

    const world = this.scene.mapManager.gridToWorld(waypoint.gridX, waypoint.gridY);

    const targetX = world.x + this.scene.mapManager.map.tileWidth / 2;
    const targetY = world.y + this.scene.mapManager.map.tileHeight / 2;

    const distance = Phaser.Math.Distance.Between(this.owner.body.center.x, this.owner.body.center.y, targetX, targetY);

    const arriveDistance = (this.owner.stats.speed * this.scene.game.loop.delta) / 1000 + 2;

    if (distance < arriveDistance) {
      this.currentWaypoint++;
      this.owner.stopMoving();

      if (this.owner.pendingSearch) {
        this.owner.enterSearching();
      }

      return;
    }

    this.owner.moveBodyCenterTowards(targetX, targetY);
  }

  tryAcquireTarget() {
    const target = this.findHighestPriorityTarget();

    if (target) {
      this.currentTarget = target;
      return true;
    }

    return false;
  }

  updateChase() {
    if (!this.hasValidTarget()) {
      this.owner.enterNavigate();
      return;
    }

    if (this.targetMode !== "player" && this.owner.distanceTo(this.currentTarget) > this.owner.aggroRange) {
      this.owner.enterNavigate();
      return;
    }

    if (this.currentTarget !== this.targetNode && this.owner.combat.isTargetInAttackRange(this.currentTarget)) {
      this.owner.enterWindup(this.currentTarget);
      return;
    }

    if (this.currentTarget === this.scene.player) {
      const time = this.scene.time.now;

      this.updatePlayerPath(time);
      this.followPlayerPath();
      return;
    }

    const pos = this.owner.getPosition(this.currentTarget);
    this.owner.moveBodyCenterTowards(pos.x, pos.y);
  }

  updateBreakObstacle(time) {
    if (!this.hasValidTarget()) {
      this.owner.enterNavigate();
      return;
    }

    if (time > this.pathCooldown) {
      this.path.length = 0;

      this.updatePath(time);

      if (this.path.length > 0) {
        this.owner.enterNavigate();
        return;
      }
    }

    const obstaclePos = this.getObstaclePosition();

    this.owner.moveBodyCenterTowards(obstaclePos.x, obstaclePos.y);

    if (Phaser.Math.Distance.Between(this.owner.body.center.x, this.owner.body.center.y, obstaclePos.x, obstaclePos.y) <= this.owner.combat.attackRange) {
      this.owner.enterWindup();
    }
  }
}
