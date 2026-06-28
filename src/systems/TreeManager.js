import { TREE_STAGE } from "../data/treeStages.js";
import Tree from "../entities/Tree.js";

export default class TreeManager {
  constructor(scene) {
    this.scene = scene;

    this.growthQueue = [];
  }

  onTreeDestroyed(tree) {
    this.growthQueue = this.growthQueue.filter((record) => {
      return !(record.x === tree.x && record.y === tree.y);
    });
    this.growthQueue.push({
      x: tree.x,
      y: tree.y,
      tree: null,
    });
    console.log(this.growthQueue);
  }

  advanceGrowth() {
    for (const record of this.growthQueue) {
      // Spawn sprout
      if (!record.tree) {
        const tree = new Tree(this.scene, record.x, record.y);

        tree.setStage(TREE_STAGE.SPROUT);

        this.scene.trees.add(tree);

        record.tree = tree;

        continue;
      }

      if (record.tree.stage === TREE_STAGE.SPROUT) {
        record.tree.setStage(TREE_STAGE.SAPLING);

        continue;
      }

      if (record.tree.stage === TREE_STAGE.SAPLING) {
        record.tree.setStage(TREE_STAGE.YOUNG);

        continue;
      }

      if (record.tree.stage === TREE_STAGE.YOUNG) {
        record.tree.setStage(TREE_STAGE.MATURE);

        record.finished = true;
      }
    }

    this.growthQueue = this.growthQueue.filter((record) => !record.finished);
  }
}
