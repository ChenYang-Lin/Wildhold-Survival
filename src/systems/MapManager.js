export default class MapManager {
  constructor(scene) {
    this.scene = scene;

    this.map = null;

    this.layers = {};

    this.camps = [];

    this.resourceZones = [];

    this.occupiedGrid = new Set();
  }

  load() {
    this.map = this.scene.make.tilemap({ key: "world_map" });

    const tileset = this.map.addTilesetImage("Tileset & Objects", "Tileset & Objects");
    const tileset2 = this.map.addTilesetImage("goblin_camp", "goblin_camp");

    this.layers.ground = this.map.createLayer("Ground", tileset, 0, 0);
    this.layers.terrainDecor = this.map.createLayer("TerrainDecor", tileset, 0, 0); // prettier-ignore
    this.layers.objects = this.map.createLayer("Object", [tileset2, tileset], 0, 0); // prettier-ignore

    this.layers.collision = this.map.createLayer("Collision", tileset);
    this.layers.collision.setVisible(false);
    this.layers.collision.setCollisionByProperty({
      collides: true,
    });

    this.loadCamps();
    this.loadResourceZones();
  }

  loadCamps() {
    const layer = this.map.getObjectLayer("Camps");
    layer.objects.forEach((camp) => {
      const campId = camp.properties?.find((p) => p.name === "campId")?.value;

      if (campId == null) {
        return;
      }

      this.camps.push({
        campId,
        x: camp.x,
        y: camp.y,
      });
    });
  }

  loadResourceZones() {
    const layer = this.map.getObjectLayer("ResourceZones");

    layer.objects.forEach((zone) => {
      const type = zone.properties?.find((p) => p.name === "type")?.value;
      const capacity = zone.properties?.find((p) => p.name === "capacity")?.value; // prettier-ignore
      const growthRate = zone.properties?.find((p) => p.name === "growthRate")?.value; // prettier-ignore
      this.resourceZones.push({
        id: zone.name,
        type,
        capacity,
        growthRate,

        gridX: Math.floor(zone.x / this.map.tileWidth),
        gridY: Math.floor(zone.y / this.map.tileHeight),

        gridWidth: Math.floor(zone.width / this.map.tileWidth),
        gridHeight: Math.floor(zone.height / this.map.tileHeight),
      });
    });
  }

  getWorldBounds() {
    return {
      width: this.map.widthInPixels,
      height: this.map.heightInPixels,
    };
  }

  getEnemyCamp(id) {
    return this.camps.find((camp) => camp.campId === id);
  }

  getResourceZones(type) {
    return this.resourceZones.filter((zone) => zone.type === type);
  }

  getRandomTileInZone(zone) {
    return {
      gridX: Phaser.Math.Between(zone.gridX, zone.gridX + zone.gridWidth - 1),
      gridY: Phaser.Math.Between(zone.gridY, zone.gridY + zone.gridHeight - 1),
    };
  }

  gridToWorld(gridX, gridY) {
    return {
      x: gridX * this.map.tileWidth,
      y: gridY * this.map.tileHeight,
    };
  }

  worldToGrid(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.map.tileWidth),
      y: Math.floor(worldY / this.map.tileHeight),
    };
  }

  isTileOccupied(gridX, gridY) {
    return this.occupiedGrid.has(`${gridX},${gridY}`);
  }

  occupyTile(gridX, gridY) {
    this.occupiedGrid.add(`${gridX},${gridY}`);
  }

  freeTile(gridX, gridY) {
    this.occupiedGrid.delete(`${gridX},${gridY}`);
  }

  isTileBlocked(gridX, gridY) {
    return this.layers.collision.getTileAt(gridX, gridY) || this.isTileOccupied(gridX, gridY);
  }
}
