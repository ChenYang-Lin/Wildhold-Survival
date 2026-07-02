export default class ResourceManager {
  constructor(scene) {
    this.scene = scene;

    this.treeManager = this.scene.treeManager;
    this.rockManager = this.scene.rockManager;

    this.spawnInitialResources();
  }

  advanceDay() {
    this.treeManager.advanceGrowth();
    this.rockManager.advanceRespawn();
  }

  spawnInitialResources() {}

  saveResources() {}

  loadResources() {}

  resetResources() {}
}
