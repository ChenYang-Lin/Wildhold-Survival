import { EQUIPMENT } from "../data/equipment.js";

export default class EquipmentSystem {
  constructor(scene) {
    this.scene = scene;

    this.equippedItems = {
      weapon: "wooden_sword",
      helmet: null,
      armor: null,
      boots: null,
    };
  }

  getEquippedItemId(category) {
    return this.equippedItems[category] || null;
  }

  getEquippedItem(category) {
    const itemId = this.getEquippedItemId(category);
    return itemId ? EQUIPMENT[itemId] : null;
  }

  getEquippedItems() {
    return { ...this.equippedItems };
  }

  equipItem(id) {
    const item = EQUIPMENT[id];

    if (!item) return false;

    if (!this.scene.inventorySystem.ownsEquipment(id)) {
      return false;
    }

    const category = item.category;

    if (!(category in this.equippedItems)) {
      console.warn(`Unsupported equipment category: ${category}`);
      return false;
    }

    this.equippedItems[category] = id;

    this.refreshEquipment();

    return true;
  }

  refreshEquipment() {
    this.scene.player.stats.refreshStats();

    this.scene.equipmentWindow?.characterEquipmentPanel.refreshStats();
    this.scene.equipmentWindow?.characterEquipmentPanel.refreshEquipment();
    this.scene.equipmentWindow?.equipmentInventoryPanel.refresh();
  }

  // Temporary compatibility methods.

  getEquippedWeaponId() {
    return this.getEquippedItemId("weapon");
  }

  getEquippedWeapon() {
    return this.getEquippedItem("weapon");
  }

  equipWeapon(id) {
    if (EQUIPMENT[id]?.category !== "weapon") {
      return false;
    }

    return this.equipItem(id);
  }
}
