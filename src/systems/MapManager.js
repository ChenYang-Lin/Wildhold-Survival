export default class MapManager {
  constructor(scene) {
    this.scene = scene;

    this.map = null;

    this.layers = {};

    this.camps = [];

    this.resourceZones = [];
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
    this.layers.object = this.map.createLayer("Object", [tileset2, tileset], 0, 0); // prettier-ignore

    this.layers.collisionLayer = this.map.getLayer("Collision", tileset);
    //   .setCollisionByProperty({
    //     collides: true,
    //   });

    this.loadCamps();
  }

  loadCamps() {
    const layer = this.map.getObjectLayer("Camps");
    layer.objects.forEach((camp) => {
      if (camp.properties && camp.properties[0]) {
        let newCamp = {
          campId: camp.properties[0].value,
          x: camp.x,
          y: camp.y,
        };
        this.camps.push(newCamp);
      }
    });

    console.log(this.camps);
  }
}
