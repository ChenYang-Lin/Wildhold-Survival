export default class HotbarSystem {
  constructor(scene) {
    this.scene = scene;

    this.combatIndex = 0;
    this.buildIndex = 0;
  }

  getItems() {
    const mode = this.scene.equipmentSystem.getMode();

    if (mode === "combat") {
      return this.scene.blueprintSystem ? this.scene.blueprintSystem.getUnlockedWeapons() : ["woodenSword"]; // prettier-ignore
      // return this.scene.blueprintSystem ? this.scene.blueprintSystem.getUnlockedWeapons() : ["woodenSword", "ironSword", "bow"]; // prettier-ignore
    }

    return this.scene.blueprintSystem ? this.scene.blueprintSystem.getUnlockedBuildings() : ["wall", "tower"]; // prettier-ignore
  }

  getSelectedItem() {
    const items = this.getItems();

    if (items.length === 0) return null;

    const mode = this.scene.equipmentSystem.getMode();

    const index = mode === "combat" ? this.combatIndex : this.buildIndex;

    return items[index];
  }

  next() {
    const items = this.getItems();

    if (items.length === 0) return;

    const mode = this.scene.equipmentSystem.getMode();

    if (mode === "combat") {
      this.combatIndex = (this.combatIndex + 1) % items.length;
    } else {
      this.buildIndex = (this.buildIndex + 1) % items.length;
    }
  }

  previous() {
    const items = this.getItems();

    if (items.length === 0) return;

    const mode = this.scene.equipmentSystem.getMode();

    if (mode === "combat") {
      this.combatIndex = (this.combatIndex - 1 + items.length) % items.length;
    } else {
      this.buildIndex = (this.buildIndex - 1 + items.length) % items.length;
    }
  }
}
