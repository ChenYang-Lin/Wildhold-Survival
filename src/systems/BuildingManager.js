import { BUILDINGS } from "../data/buildings.js";
import Wall from "../entities/Wall.js";

export default class BuildingManager {
  constructor(scene) {
    this.scene = scene;

    this.grid = new Map();
    this.buildings = this.scene.physics.add.staticGroup();

    this.tileSize = 32;
  }

  canPlace(type, gridX, gridY) {
    const b = BUILDINGS[type];

    for (let x = 0; x < b.width; x++) {
      for (let y = 0; y < b.height; y++) {
        const checkX = gridX + x;
        const checkY = gridY + y;

        const mapWidthTiles = 1600 / 32;
        const mapHeightTiles = 1200 / 32;
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
    if (this.isOccupied(gridX, gridY)) return true; // building (wall, tower, etc)
    if (this.hasEnemy(gridX, gridY)) return true;
    if (this.hasPlayer(gridX, gridY)) return true;
    if (this.hasTree(gridX, gridY)) return true;

    return false;
  }

  isOccupied(x, y) {
    return this.grid.has(`${x},${y}`);
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

  hasTree() {
    return false;
  }

  getWalls() {
    return this.buildings.getChildren().filter((b) => b instanceof Wall);
  }

  placeBuilding(type, gridX, gridY) {
    if (!this.canPlace(type, gridX, gridY)) return false;

    const building = BUILDINGS[type];

    const worldX = gridX * this.tileSize + (building.width * this.tileSize) / 2;
    const worldY = gridY * this.tileSize + (building.height * this.tileSize ) / 2; // prettier-ignore

    let obj;

    if (type === "wall") {
      obj = new Wall(this.scene, worldX, worldY);
      this.buildings.add(obj);
      console.log(obj.body instanceof Phaser.Physics.Arcade.StaticBody);
    }

    // mark occupied tiles
    for (let x = 0; x < building.width; x++) {
      for (let y = 0; y < building.height; y++) {
        this.grid.set(`${gridX + x},${gridY + y}`, obj);
      }
    }
    return obj;
  }

  removeBuilding(building) {
    for (const [key, value] of this.grid.entries()) {
      if (value === building) {
        this.grid.delete(key);
      }
    }

    building.destroy();
  }
}
