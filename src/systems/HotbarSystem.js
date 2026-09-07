import { WEAPONS } from "../data/weapons.js";

export default class HotbarSystem {
  constructor(scene) {
    this.scene = scene;

    this.dayIndex = 0;
    this.nightIndex = 0;
  }

  getItems() {
    if (this.scene.dayNightSystem.isNight) {
      return ["woodenSword", "healthPotion"];
    }

    return ["woodenSword", "wall", "tower"];
  }

  getSelectedIndex() {
    const items = this.getItems();

    if (items.length === 0) return -1;

    let index = this.scene.dayNightSystem.isNight ? this.nightIndex : this.dayIndex;

    if (index >= items.length) {
      index = 0;

      if (this.scene.dayNightSystem.isNight) {
        this.nightIndex = index;
      } else {
        this.dayIndex = index;
      }
    }

    return index;
  }

  getSelectedItem() {
    const index = this.getSelectedIndex();

    if (index === -1) return null;

    return this.getItems()[index];
  }

  select(index) {
    const items = this.getItems();

    if (items.length === 0) return;
    if (index < 0 || index >= items.length) return;

    if (this.scene.dayNightSystem.isNight) {
      this.nightIndex = index;
    } else {
      this.dayIndex = index;
    }

    const itemId = items[index];

    if (WEAPONS[itemId]) {
      this.scene.equipmentSystem.equipWeapon(itemId);
    }
  }

  selectItem(id) {
    const items = this.getItems();

    const index = items.indexOf(id);

    if (index === -1) return false;

    this.select(index);

    return true;
  }

  next() {
    const items = this.getItems();

    if (items.length === 0) return;

    const index = (this.getSelectedIndex() + 1) % items.length;

    this.select(index);
  }

  previous() {
    const items = this.getItems();

    if (items.length === 0) return;

    const index = (this.getSelectedIndex() - 1 + items.length) % items.length;

    this.select(index);
  }
}
