import ResourceDrop from "../entities/ResourceDrop.js";

export default class ResourceSystem {
  constructor(scene) {
    this.scene = scene;

    this.drops = scene.physics.add.group();

    scene.physics.add.overlap(scene.player, this.drops, (_, drop) => {
      drop.pickup(scene.player);
    });
  }

  spawnDrop(itemId, x, y, amount = 1) {
    const drop = new ResourceDrop(this.scene, x, y, itemId, amount);
    this.drops.add(drop);

    return drop;
  }
}
