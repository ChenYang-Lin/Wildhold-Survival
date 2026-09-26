import { BUILDINGS } from "../data/buildings.js";
import { POTIONS } from "../data/potions.js";

export default class ActionSystem {
  constructor(scene, player, inputController) {
    this.scene = scene;
    this.player = player;
    this.inputController = inputController;
  }

  handlePlaceable(itemId) {}

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

  update() {}
}
