import { BUILDINGS } from "../data/buildings.js";

export default class ActionSystem {
  constructor(scene, player, inputController) {
    this.scene = scene;
    this.player = player;
    this.inputController = inputController;
  }

  handlePlaceable(item) {
    const state = this.inputController.state;

    const gridX = Math.floor(state.aimWorldX / 32);
    const gridY = Math.floor(state.aimWorldY / 32);

    // Check if there is enough resource for placing selected building (wall, tower, etc)
    const recipe = BUILDINGS[item.id];

    if (!recipe) return;

    if (!this.canAfford(recipe)) {
      console.log("Not enough resources");
      return;
    }

    // Try to place building - if current spot is placeable; return boolean of success or fail place
    const placed = this.scene.buildingManager.placeBuilding(recipe.id, gridX, gridY); // prettier-ignore
    if (placed) {
      this.payCost(recipe);
    }
  }

  canAfford(recipe) {
    const inventory = this.scene.inventorySystem;

    for (const [resource, amount] of Object.entries(recipe.cost)) {
      if (!inventory.hasResource(resource, amount)) {
        return false;
      }
    }

    return true;
  }

  payCost(recipe) {
    const inventory = this.scene.inventorySystem;

    for (const [resource, amount] of Object.entries(recipe.cost)) {
      inventory.consumeResource(resource, amount);
    }
  }

  handleCombat(itemId) {
    switch (itemId) {
      case "woodenSword":
        this.player.attackMelee();
        break;
      case "bow":
        console.log("shoot bow");
        break;
    }
  }

  update() {
    const state = this.inputController.state;

    // Handle action pressed
    if (state.actionPressed) {
      state.actionPressed = false;

      const itemId = this.scene.hotbarSystem.getSelectedItem();
      const mode = this.scene.equipmentSystem.getMode();

      if (!itemId) return;

      if (mode === "combat") {
        this.handleCombat(itemId);
      }

      if (mode === "build") {
        this.handlePlaceable({ id: itemId });
      }
    }

    // check toggler for Build mode and Combat mode
    if (state.toggleBuildModePressed) {
      state.toggleBuildModePressed = false;

      this.scene.equipmentSystem.toggleMode();

      console.log("Mode:", this.scene.equipmentSystem.getMode());
    }

    // check mouse wheel scroll for Build/Combat item select in hotbar
    if (state.hotbarScroll > 0) {
      this.scene.hotbarSystem.next();
    }

    if (state.hotbarScroll < 0) {
      this.scene.hotbarSystem.previous();
    }

    state.hotbarScroll = 0;
  }
}
