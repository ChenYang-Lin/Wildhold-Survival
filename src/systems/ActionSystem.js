import { BUILDINGS } from "../data/buildings.js";
import { POTIONS } from "../data/potions.js";

export default class ActionSystem {
  constructor(scene, player, inputController) {
    this.scene = scene;
    this.player = player;
    this.inputController = inputController;
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

  repairBuilding(building) {
    if (!building?.active || !building.body || !building.maxHP > 0) return false;

    // Don't charge for a building that needs no repair.
    if (building.hp >= building.maxHP) {
      console.log("Building is already at full health");
      return false;
    }

    const buildingData = BUILDINGS[building.texture.key];

    if (!buildingData?.repairCost) {
      console.warn("Repair cost is not configured for this building");
      return false;
    }

    const repairRecipe = {
      cost: buildingData.repairCost,
    };

    if (!this.canAfford(repairRecipe)) {
      console.log("Not enough resources to repair");
      return false;
    }

    this.payCost(repairRecipe);

    building.setHP(building.maxHP);

    return true;
  }

  upgradeBuilding(building) {
    if (!building?.active || !building.body) return false;

    const buildingData = BUILDINGS[building.texture.key];

    if (!buildingData?.upgrades) return false;

    if (building.level >= buildingData.maxLevel) {
      console.log("Building is already at maximum level");
      return false;
    }

    const nextLevel = building.level + 1;
    const upgrade = buildingData.upgrades[nextLevel];

    if (!upgrade) {
      console.warn(`Upgrade data missing for level ${nextLevel}`);
      return false;
    }

    const recipe = { cost: upgrade.cost };

    if (!this.canAfford(recipe)) {
      console.log("Not enough resources to upgrade");
      return false;
    }

    // Pay only after all validation succeeds.
    this.payCost(recipe);

    building.level = nextLevel;
    building.maxHP = upgrade.maxHP;

    // Apply stats specific to buildings that support them.
    if (Number.isFinite(upgrade.damage)) {
      building.damage = upgrade.damage;
    }

    if (Number.isFinite(upgrade.range)) {
      building.range = upgrade.range;
    }

    // Restore health after upgrading.
    building.setHP(building.maxHP);

    return true;
  }

  update() {}
}
