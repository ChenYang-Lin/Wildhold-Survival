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
  }

  hasValidTarget() {
    return this.currentTarget && this.currentTarget.active;
  }

  getAttackTarget() {
    return this.currentTarget;
  }

  findHighestPriorityTarget() {
    const owner = this.owner;

    const tower = this.scene.buildingManager.getNearestTower(owner.body.center.x, owner.body.center.y, owner.aggroRange);

    if (tower && owner.distanceTo(tower) < owner.aggroRange) {
      return tower;
    }

    const player = this.scene.player;

    if (owner.distanceTo(player) < owner.aggroRange) {
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

        if (building) {
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

    if (this.scene.mapManager.isTileBlocked(waypoint.gridX, waypoint.gridY)) {
      this.path.length = 0;
      return;
    }

    const world = this.scene.mapManager.gridToWorld(waypoint.gridX, waypoint.gridY);

    const targetX = world.x + this.scene.mapManager.map.tileWidth / 2;
    const targetY = world.y + this.scene.mapManager.map.tileHeight / 2;

    const distance = Phaser.Math.Distance.Between(this.owner.body.center.x, this.owner.body.center.y, targetX, targetY);

    const arriveDistance = (this.owner.speed * this.scene.game.loop.delta) / 1000 + 2;

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

    vx = (vx / length) * this.owner.speed;
    vy = (vy / length) * this.owner.speed;

    this.owner.setVelocity(vx, vy);

    this.owner.updateFacing();
    this.owner.anims.play(`${this.owner.type}_walk_${this.owner.facing}`, true);
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

    if (this.owner.distanceTo(this.currentTarget) > this.owner.aggroRange) {
      this.owner.enterNavigate();
      return;
    }

    if (this.currentTarget !== this.targetNode && this.owner.combat.isTargetInAttackRange(this.currentTarget)) {
      this.owner.enterWindup(this.currentTarget);
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
