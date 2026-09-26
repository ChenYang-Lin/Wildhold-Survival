import { BUILDINGS } from "../data/buildings.js";
import { POTIONS } from "../data/potions.js";

export default class HotbarSystem {
  constructor(scene) {
    this.scene = scene;
  }

  getItems() {
    if (this.scene.dayNightSystem.isNight) {
      return ["healthPotion", "staminaPotion"];
    }

    return ["wall", "tower"];
  }

  getItemData(itemId) {
    return BUILDINGS[itemId] || POTIONS[itemId];
  }

  activateItem(itemId) {
    if (!itemId) return;

    if (BUILDINGS[itemId]) {
      this.scene.placementSystem.start(itemId);
      return;
    }

    if (POTIONS[itemId]) {
      this.scene.actionSystem.handlePotion(itemId);
    }
  }
}
