export default class MapManager {
  constructor(scene) {
    this.scene = scene;

    this.map = null;

    this.layers = {};

    this.camps = [];

    this.resourceZones = [];
  }

  getWorldBounds() {
    return {
      width: this.map.widthInPixels,
      height: this.map.heightInPixels,
    };
  }

  getCamp(id) {
    return this.camps.find((camp) => camp.campId === id);
  }

  load() {
    this.map = this.scene.make.tilemap({ key: "world_map" });

    const tileset = this.map.addTilesetImage(
      "Tileset & Objects",
      "Tileset & Objects",
    );
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
}
