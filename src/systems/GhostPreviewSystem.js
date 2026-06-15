import { BUILDINGS } from "../data/buildings.js";

export default class GhostPreviewSystem {
  constructor(scene) {
    this.scene = scene;

    this.currentBuildingType = null;
    this.preview = null;
  }

  setBuilding(type) {
    // prevent recreating same preview every frame
    if (this.currentBuildingType === type) {
      return;
    }

    this.currentBuildingType = type;

    if (this.preview) {
      this.preview.destroy();
    }

    const data = BUILDINGS[type];

    this.preview = this.scene.add.image(0, 0, data.texture);
    this.preview.setAlpha(0.5);
    this.preview.setDepth(999);
  }

  hide() {
    if (this.preview) {
      this.preview.setVisible(false);
    }
  }

  // worldToGrid(value) {
  //   return Math.floor(value / 32);
  // }

  // gridToWorld(grid) {
  //   return grid * 32 + 16; // the +16 puts the object at the center of the tile
  // }

  update() {
    if (!this.preview) return;

    const building = BUILDINGS[this.currentBuildingType];

    const state = this.scene.inputController.state;

    const gridX = Math.floor(state.aimWorldX / 32);
    const gridY = Math.floor(state.aimWorldY / 32);

    const worldX = gridX * 32 + (building.width * 32) / 2;
    const worldY = gridY * 32 + (building.height * 32) / 2;

    this.preview.setVisible(true);
    this.preview.setPosition(worldX, worldY);

    const valid = this.scene.buildingManager.canPlace(
      this.currentBuildingType,
      gridX,
      gridY,
    );
    if (valid) {
      this.preview.clearTint();
    } else {
      this.preview.setTint(0xff0000);
    }
  }
}
