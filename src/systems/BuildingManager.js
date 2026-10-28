import { BUILDINGS } from "../data/buildings.js";
import Campfire from "../entities/Campfire.js";
import Spike from "../entities/Spike.js";
import Tower from "../entities/Tower.js";
import Wall from "../entities/Wall.js";

export default class BuildingManager {
  constructor(scene) {
    this.scene = scene;

    this.buildings = this.scene.physics.add.group();

    this.tileSize = 32;
  }

  getCampfires() {
    return this.buildings.getChildren().filter((building) => building instanceof Campfire);
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

  canPlace(type, gridX, gridY, ignoreBuilding = null) {
    const buildingData = BUILDINGS[type];

    if (!buildingData) return false;

    for (let x = 0; x < buildingData.width; x++) {
      for (let y = 0; y < buildingData.height; y++) {
        const checkX = gridX + x + (buildingData.footprintOffsetX || 0);
        const checkY = gridY + y + (buildingData.footprintOffsetY || 0);

        const bounds = this.scene.mapManager.getWorldBounds();
        const mapWidthTiles = bounds.width / this.tileSize;
        const mapHeightTiles = bounds.height / this.tileSize;

        if (checkX < 0 || checkY < 0 || checkX >= mapWidthTiles || checkY >= mapHeightTiles) {
          return false;
        }

        if (this.tileBlocked(checkX, checkY, ignoreBuilding)) {
          return false;
        }
      }
    }

    return true;
  }

  tileBlocked(gridX, gridY, ignoreBuilding = null) {
    const mapManager = this.scene.mapManager;

    // Terrain collision must always block placement.
    if (mapManager.isTileCollidable(gridX, gridY)) {
      return true;
    }

    // Ignore only the moving building's current occupied tiles.
    const isOccupiedByOtherBuilding = this.buildings.getChildren().some((building) => {
      if (!building.active || building === ignoreBuilding) {
        return false;
      }

      return building.occupiedTiles.some((tile) => tile.gridX === gridX && tile.gridY === gridY);
    });

    if (isOccupiedByOtherBuilding) return true;

    if (this.hasEnemy(gridX, gridY)) return true;
    if (this.hasPlayer(gridX, gridY)) return true;

    return false;
  }

  moveBuilding(building, gridX, gridY) {
    if (!building?.active || !building.body) return false;

    const type = building.texture.key;

    if (!this.canPlace(type, gridX, gridY, building)) {
      return false;
    }

    const buildingData = BUILDINGS[type];

    // Calculate the destination using the same positioning logic
    // used when the building was originally placed.
    const position = this.getBuildingWorldPosition(buildingData, gridX, gridY);

    // Free the building's old occupied tiles.
    for (const tile of building.occupiedTiles) {
      this.scene.mapManager.freeTile(tile.gridX, tile.gridY);
    }

    // Move the existing object
    building.setPosition(position.x, position.y);
    building.body.reset(position.x, position.y);
    building.setDepth(building.body.bottom);

    // Record and occupy the new tiles.
    building.occupiedTiles = [];

    for (let x = 0; x < buildingData.width; x++) {
      for (let y = 0; y < buildingData.height; y++) {
        const occupiedX = gridX + x + (buildingData.footprintOffsetX || 0);
        const occupiedY = gridY + y + (buildingData.footprintOffsetY || 0);

        this.scene.mapManager.occupyTile(occupiedX, occupiedY);

        building.occupiedTiles.push({
          gridX: occupiedX,
          gridY: occupiedY,
        });
      }
    }

    if (building.drawHealthBar) {
      building.drawHealthBar();
    }

    return true;
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
    } else if (type === "tower") {
      obj = new Tower(this.scene, worldX, worldY);
    } else if (type === "spike") {
      obj = new Spike(this.scene, worldX, worldY);
    } else if (type === "campfire") {
      obj = new Campfire(this.scene, worldX, worldY);
    }

    this.buildings.add(obj);
    obj.body.setImmovable(true);

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
    this.scene.questSystem.onBuildingPlaced(type);
    return obj;
  }

  removeBuilding(building) {
    building.occupiedTiles.forEach((occupiedTile) => {
      this.scene.mapManager.freeTile(occupiedTile.gridX, occupiedTile.gridY);
    });

    building.destroy();
  }

  getBuildingAtGrid(gridX, gridY) {
    let result = null;

    this.buildings.children.iterate((building) => {
      if (!building || !building.active) return;

      const occupiesTile = building.occupiedTiles.some((tile) => tile.gridX === gridX && tile.gridY === gridY);

      if (occupiesTile) {
        result = building;
      }
    });

    return result;
  }
}
