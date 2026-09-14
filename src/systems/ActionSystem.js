import { BUILDINGS } from "../data/buildings.js";
import { POTIONS } from "../data/potions.js";

export default class ActionSystem {
  constructor(scene, player, inputController) {
    this.scene = scene;
    this.player = player;
    this.inputController = inputController;
  }

  handlePlaceable(itemId) {
    const state = this.inputController.state;

    const gridX = Math.floor(state.aimWorldX / 32);
    const gridY = Math.floor(state.aimWorldY / 32);

    const recipe = BUILDINGS[itemId];

    if (!recipe) return;

    if (!this.canAfford(recipe)) {
      console.log("Not enough resources");
      return;
    }

    const placed = this.scene.buildingManager.placeBuilding(recipe.id, gridX, gridY);

    if (placed) {
      this.payCost(recipe);
    }
  }

  handlePotion(itemId) {
    const potion = POTIONS[itemId];

    if (!potion) return;

    if (!this.canAfford(potion)) {
      console.log("Not enough resources");
      return;
    }

    const used = this.applyPotion(potion);

    if (used) {
      this.payCost(potion);
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

  applyPotion(potion) {
    if (potion.id === "healthPotion") {
      if (this.player.health.isDead) {
        return false;
      }

      if (this.player.health.hp >= this.player.health.maxHP) {
        return false;
      }

      this.player.health.heal(potion.healAmount);

      return true;
    }

    if (potion.id === "staminaPotion") {
      if (this.player.stats.stamina >= this.player.stats.current.maxStamina) {
        return false;
      }

      this.player.stats.recoverStamina(potion.restoreAmount);

      return true;
    }

    return false;
  }

  update() {
    const state = this.inputController.state;

    if (state.actionPressed) {
      const itemId = this.scene.hotbarSystem.getSelectedItem();

      if (!itemId) return;

      if (BUILDINGS[itemId]) {
        this.handlePlaceable(itemId);
      } else if (POTIONS[itemId]) {
        this.handlePotion(itemId);
      }
    }

    if (state.hotbarScroll > 0) {
      this.scene.hotbarSystem.next();
    }

    if (state.hotbarScroll < 0) {
      this.scene.hotbarSystem.previous();
    }

    state.hotbarScroll = 0;
  }
}
