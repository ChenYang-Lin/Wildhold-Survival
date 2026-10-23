import BuildingInfoCard from "../ui/BuildingInfoCard.js";

export default class BuildingInteractionSystem {
  constructor(scene) {
    this.scene = scene;
    this.selectedBuilding = null;

    this.card = new BuildingInfoCard(
      scene,
      () => this.close(),
      (building) => this.scene.actionSystem.repairBuilding(building),
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

    // Ignore clicks elsewhere on the card.
    if (this.card.containsScreenPoint(pointer.x, pointer.y)) {
      return true;
    }

    // Clicking outside closes the card.
    this.close();
    return true;
  }

  select(building) {
    if (!building?.active) return;

    this.selectedBuilding = building;
    this.card.show(building);
  }

  close() {
    this.selectedBuilding = null;
    this.card.hide();
  }

  update() {
    if (this.selectedBuilding && (!this.selectedBuilding.active || !this.selectedBuilding.body)) {
      this.close();
      return;
    }

    this.card.update();
  }

  destroy() {
    this.scene.events.off("postupdate", this.update, this);
    this.card.destroy();
  }
}
