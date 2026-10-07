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

    return ["wall", "tower", "healthPotion", "staminaPotion", "tower", "staminaPotion", "staminaPotion", "tower", "staminaPotion"];
  }

  getItemData(itemId) {
    return BUILDINGS[itemId] || POTIONS[itemId];
  }

  activateItem(itemId) {
    if (!itemId) return;

    const actionId = `hotbar.${itemId}`;

    if (!this.scene.tutorialSystem?.isActionAllowed(actionId)) {
      return;
    }

    if (BUILDINGS[itemId]) {
      const started = this.scene.placementSystem.start(itemId);

      if (started) {
        this.scene.tutorialSystem?.handleAction(actionId);
      }

      return;
    }

    if (POTIONS[itemId]) {
      this.scene.actionSystem.handlePotion(itemId);

      this.scene.tutorialSystem?.handleAction(actionId);
    }
  }
}
