import Rock from "../entities/Rock.js";
import Tree from "../entities/Tree.js";

export default class ResourceManager {
  constructor(scene) {
    this.scene = scene;
  }

  advanceDay() {
    this.scene.treeManager.advanceGrowth();
    this.scene.rockManager.advanceRespawn();
  }

  spawnInitialResources() {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      let x = Phaser.Math.Between(100, 1500);
      let y = Phaser.Math.Between(100, 1500);

      if (count % 2 === 0) {
        let tree = new Tree(this.scene, x, y);
        this.scene.trees.add(tree);
      } else {
        let rock = new Rock(this.scene, x, y);
        this.scene.rocks.add(rock);
      }
      count++;
    }
  }

  saveResources() {}

  loadResources() {}

  resetResources() {}
}
