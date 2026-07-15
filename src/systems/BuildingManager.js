import { BUILDINGS } from "../data/buildings.js";
import Tower from "../entities/Tower.js";
import Wall from "../entities/Wall.js";

export default class BuildingManager {
  constructor(scene) {
    this.scene = scene;

    this.buildings = this.scene.physics.add.staticGroup();

    this.tileSize = 32;
  }

  getNearestTower(x, y, maxDistance) {
    const towers = this.getTowers();

    let nearestTower = null;
    let nearestDistance = maxDistance;

    towers.forEach((tower) => {
      let dist = Phaser.Math.Distance.Between(tower.body.center.x, tower.body.center.y, x, y); // prettier-ignore
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestTower = tower;
      }
    });

    return nearestTower;
  }

  canPlace(type, gridX, gridY) {
    const b = BUILDINGS[type];

    for (let x = 0; x < b.width; x++) {
      for (let y = 0; y < b.height; y++) {
        const checkX = gridX + x + (b.footprintOffsetX || 0);
        const checkY = gridY + y + (b.footprintOffsetY || 0);

        const bounds = this.scene.mapManager.getWorldBounds();
        const mapWidthTiles = bounds.width / 32;
        const mapHeightTiles = bounds.height / 32;
        if (checkX < 0 || checkY < 0) return false;

        if (checkX >= mapWidthTiles || checkY >= mapHeightTiles) return false;

        if (this.tileBlocked(checkX, checkY)) {
          return false;
        }
      }
    }

    return true;
  }

  tileBlocked(gridX, gridY) {
    if (this.scene.mapManager.isTileBlocked(gridX, gridY)) return true;
    if (this.hasEnemy(gridX, gridY)) return true;
    if (this.hasPlayer(gridX, gridY)) return true;

    return false;
  }

  hasEnemy(gridX, gridY) {
    const enemies = this.scene.combatSystem.getEnemies().getChildren();
    for (const enemy of enemies) {
      const enemyGridX = Math.floor(enemy.body.center.x / 32);
      const enemyGridY = Math.floor(enemy.body.center.y / 32);

      if (enemyGridX === gridX && enemyGridY === gridY) return true;
    }
    return false;
  }

  hasPlayer(gridX, gridY) {
    const playerGridX = Math.floor(this.scene.player.body.center.x / 32);
    const playerGridY = Math.floor(this.scene.player.body.center.y / 32);

    return playerGridX === gridX && playerGridY === gridY;
  }

  getWalls() {
    return this.buildings.getChildren().filter((b) => b instanceof Wall);
  }

  getTowers() {
    return this.buildings.getChildren().filter((b) => b instanceof Tower);
  }

  getBuildingWorldPosition(building, gridX, gridY) {
    return {
      x: gridX * this.tileSize + building.footprintWidth / 2 + (building.spriteWidth - building.footprintWidth) / 2,
      y: gridY * this.tileSize + building.footprintHeight / 2 + (building.spriteHeight - building.footprintHeight) / 2,
    };
  }

  placeBuilding(type, gridX, gridY) {
    if (!this.canPlace(type, gridX, gridY)) return false;

    const building = BUILDINGS[type];

    const worldX = this.getBuildingWorldPosition(building, gridX, gridY).x;
    const worldY = this.getBuildingWorldPosition(building, gridX, gridY).y;

    let obj;

    if (type === "wall") {
      obj = new Wall(this.scene, worldX, worldY);
      this.buildings.add(obj);
    } else if (type === "tower") {
      obj = new Tower(this.scene, worldX, worldY);
      this.buildings.add(obj);
    }

    obj.occupiedTiles = [];
    // mark occupied tiles
    for (let x = 0; x < building.width; x++) {
      for (let y = 0; y < building.height; y++) {
        const occupiedX = gridX + x + (building.footprintOffsetX || 0);
        const occupiedY = gridY + y + (building.footprintOffsetY || 0);

        this.scene.mapManager.occupyTile(occupiedX, occupiedY);

        obj.occupiedTiles.push({ gridX: occupiedX, gridY: occupiedY });
      }
    }

    // Objective hook
    this.scene.objectiveSystem.onBuildingPlaced(type);
    return obj;
  }

  removeBuilding(building) {
    building.occupiedTiles.forEach((occupiedTile) => {
      this.scene.mapManager.freeTile(occupiedTile.gridX, occupiedTile.gridY);
    });

    building.destroy();
  }
}
