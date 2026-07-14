import { TREE_STAGE } from "../data/treeStages.js";
import Rock from "../entities/Rock.js";
import Tree from "../entities/Tree.js";

export default class ResourceManager {
  constructor(scene) {
    this.scene = scene;

    this.treeGrowthQueue = [];
  }

  advanceDay() {
    this.advanceTreeGrowth();

    this.regenerateResources(
      "tree",
      Tree,
      this.scene.trees,
      (tree) => tree.setStage(TREE_STAGE.SPROUT),
      (tree) =>
        this.treeGrowthQueue.push({
          tree: tree,
        }),
    );

    this.regenerateResources("rock", Rock, this.scene.rocks);
  }

  spawnInitialResources() {
    this.spawnZoneResources("tree", Tree, this.scene.trees);

    this.spawnZoneResources("rock", Rock, this.scene.rocks);
  }

  spawnZoneResources(type, ResourceClass, group) {
    const zones = this.scene.mapManager.getResourceZones(type);

    for (const zone of zones) {
      for (let i = 0; i < zone.capacity; i++) {
        const point = this.scene.mapManager.getRandomTileInZone(zone);

        // Don't spawn if tile exist on collision layer or occupied
        if (this.scene.mapManager.isTileBlocked(point.gridX, point.gridY)) continue;

        this.spawnResource(ResourceClass, group, point.gridX, point.gridY);
      }
    }
  }

  regenerateResources(type, ResourceClass, group, onSpawn = null, registerGrowth = null) {
    const zones = this.scene.mapManager.getResourceZones(type);

    for (const zone of zones) {
      const current = this.getResourceCountInZone(zone, group);
      const attempts = Math.ceil((zone.capacity - current) * zone.growthRate); // missing trees * growth rate

      for (let i = 0; i < attempts; i++) {
        const point = this.scene.mapManager.getRandomTileInZone(zone);

        if (this.scene.mapManager.isTileBlocked(point.gridX, point.gridY)) continue;

        this.spawnResource(ResourceClass, group, point.gridX, point.gridY, onSpawn, registerGrowth);
      }
    }
  }

  spawnResource(ResourceClass, group, gridX, gridY, onSpawn = null, registerGrowth = null) {
    const { x, y } = this.scene.mapManager.gridToWorld(gridX, gridY);

    const resource = new ResourceClass(this.scene, x + 16, y + 16 + (ResourceClass.FOOT_OFFSET_Y ?? 0));

    resource.setGridPosition(gridX, gridY);

    if (onSpawn) {
      onSpawn(resource);
    }

    if (registerGrowth) {
      registerGrowth(resource);
    }

    group.add(resource);

    this.scene.mapManager.occupyTile(gridX, gridY);
  }

  getResourceCountInZone(zone, group) {
    let count = 0;

    group.children.iterate((resource) => {
      if (
        resource.gridX >= zone.gridX &&
        resource.gridX < zone.gridX + zone.gridWidth &&
        resource.gridY >= zone.gridY &&
        resource.gridY < zone.gridY + zone.gridHeight
      ) {
        count++;
      }
    });

    return count;
  }

  onTreeDestroyed(tree) {
    this.treeGrowthQueue = this.treeGrowthQueue.filter((record) => {
      return record.tree !== tree;
    });
  }

  advanceTreeGrowth() {
    for (const record of this.treeGrowthQueue) {
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

    this.treeGrowthQueue = this.treeGrowthQueue.filter((record) => !record.finished);
  }

  saveResources() {}

  loadResources() {}

  resetResources() {}
}
