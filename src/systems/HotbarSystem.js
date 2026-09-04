export default class HotbarSystem {
  constructor(scene) {
    this.scene = scene;

    this.weaponIndex = 0;
    this.buildIndex = 0;
  }

  getItems() {
    if (this.scene.dayNightSystem.isNight) {
      return ["woodenSword"];
    }

    return ["wall", "tower"];
  }

  getSelectedIndex() {
    const items = this.getItems();

    if (items.length === 0) return -1;

    let index = this.scene.dayNightSystem.isNight ? this.weaponIndex : this.buildIndex;

    // Keep selection valid if the available items changed.
    if (index >= items.length) {
      index = 0;

      if (this.scene.dayNightSystem.isNight) {
        this.weaponIndex = index;
      } else {
        this.buildIndex = index;
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
      this.weaponIndex = index;

      const weaponId = items[index];
      this.scene.equipmentSystem.equipWeapon(weaponId);
    } else {
      this.buildIndex = index;
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

    const index = this.scene.dayNightSystem.isNight ? (this.weaponIndex + 1) % items.length : (this.buildIndex + 1) % items.length;

    this.select(index);
  }

  previous() {
    const items = this.getItems();

    if (items.length === 0) return;

    const index = this.scene.dayNightSystem.isNight
      ? (this.weaponIndex - 1 + items.length) % items.length
      : (this.buildIndex - 1 + items.length) % items.length;

    this.select(index);
  }
}
