import BuildingInfoCard from "../ui/BuildingInfoCard.js";
import { BUILDINGS } from "../data/buildings.js";

export default class BuildingInteractionSystem {
  constructor(scene) {
    this.scene = scene;
    this.selectedBuilding = null;

    // Building Move function properties
    this.movingBuilding = null;
    this.mode = "normal";
    this.movePreview = null;
    this.moveGridX = 0;
    this.moveGridY = 0;
    this.isMoveValid = false;

    this.rangeIndicator = scene.add.graphics().setDepth(15000);

    this.card = new BuildingInfoCard(
      scene,
      () => this.close(),
      (building) => this.scene.actionSystem.repairBuilding(building),
      (building) => this.scene.actionSystem.upgradeBuilding(building),
      (building) => this.startMovingBuilding(building),
    );

    this.scene.events.on("postupdate", this.update, this);
    this.scene.events.once("shutdown", this.destroy, this);
  }

  getBuildingAtWorld(worldX, worldY) {
    const manager = this.scene.buildingManager;
    if (!manager) return null;

    // First check the actual physics hitboxes.
    // This is useful when the artwork extends beyond the occupied tiles.
    const buildings = manager.buildings.getChildren();

    for (const building of buildings) {
      if (!building?.active || !building.body?.enable) continue;

      const body = building.body;

      if (worldX >= body.left && worldX <= body.right && worldY >= body.top && worldY <= body.bottom) {
        return building;
      }
    }

    // Fallback to the occupied-tile lookup already implemented
    // by BuildingManager.
    const { gridX, gridY } = this.scene.mapManager.worldToGrid(worldX, worldY);

    return manager.getBuildingAtGrid(gridX, gridY);
  }

  handlePointerDown(pointer) {
    if (!this.card.container.visible) {
      const building = this.getBuildingAtWorld(pointer.worldX, pointer.worldY);

      if (building) {
        this.select(building);
        return true;
      }

      if (this.selectedBuilding) {
        this.close();
        return true;
      }

      return false;
    }

    // Handle the close button.
    if (this.card.containsCloseButtonPoint(pointer.x, pointer.y)) {
      this.close();
      return true;
    }

    // Handle the repair button.
    if (this.card.containsRepairButtonPoint(pointer.x, pointer.y)) {
      if (this.selectedBuilding?.active) {
        this.card.onRepair?.(this.selectedBuilding);
      }
      return true;
    }

    // Handle the upgrade button.
    if (this.card.containsUpgradeButtonPoint(pointer.x, pointer.y)) {
      if (this.selectedBuilding?.active && this.card.canUpgrade) {
        this.card.onUpgrade?.(this.selectedBuilding);
      }

      return true;
    }

    // Handle the move button.
    if (this.card.containsMoveButtonPoint(pointer.x, pointer.y)) {
      if (this.selectedBuilding?.active) {
        this.card.onMove?.(this.selectedBuilding);
      }

      return true;
    }

    // Ignore clicks elsewhere on the card.
    if (this.card.containsScreenPoint(pointer.x, pointer.y)) {
      return true;
    }

    // Clicking another building switches the selection.
    const building = this.getBuildingAtWorld(pointer.worldX, pointer.worldY);

    if (building) {
      this.select(building);
      return true;
    }

    // Clicking empty ground closes the card.
    this.close();
    return true;
  }

  handlePointerMove(pointer) {
    if (this.mode !== "moving") return;

    this.updateMovePreview(pointer.worldX, pointer.worldY);
  }

  select(building) {
    if (!building?.active) return;

    this.selectedBuilding = building;
    this.card.show(building);
  }

  close() {
    this.selectedBuilding = null;
    this.card.hide();
    this.rangeIndicator.clear();
  }

  updateRangeIndicator() {
    const graphics = this.rangeIndicator;
    graphics.clear();

    const building = this.selectedBuilding;

    if (!this.card.container.visible || !building?.active || !building.body || !Number.isFinite(building.range) || building.range <= 0) {
      return;
    }

    const { x, y } = building.body.center;
    const radius = building.range;

    // Subtle transparent fill.
    graphics.fillStyle(0x66ccff, 0.08);
    graphics.fillCircle(x, y, radius);

    // Visible outline.
    graphics.lineStyle(2, 0x66ccff, 0.8);
    graphics.strokeCircle(x, y, radius);
  }

  startMovingBuilding(building) {
    if (!building?.active) return;

    const started = this.scene.placementSystem?.startMoving(building);

    if (!started) return;

    this.card.hide();
  }

  update() {
    if (this.selectedBuilding && (!this.selectedBuilding.active || !this.selectedBuilding.body)) {
      this.close();
      return;
    }

    this.card.update();
    this.updateRangeIndicator();
  }

  destroy() {
    this.scene.events.off("postupdate", this.update, this);

    this.rangeIndicator.destroy();
    this.card.destroy();
  }
}
