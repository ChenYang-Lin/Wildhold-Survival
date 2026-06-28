export default class TreeManager {
  constructor(scene) {
    this.scene = scene;

    this.regrowingTrees = [];
  }

  onTreeDestroyed(tree) {
    this.regrowingTrees.push({
      x: tree.x,
      y: tree.y,
      stage: "sprout",
    });
    console.log(this.regrowingTrees);
  }
}
