export default class EquipmentSystem {
  constructor(scene) {
    this.scene = scene;

    this.mode = "combat";

    this.equippedWeapon = "woodenSword";

    this.equippedconsumable = null;
  }

  setMode(mode) {
    this.mode = mode;
  }

  toggleMode() {
    this.mode =
      this.mode === "combat" ? (this.mode = "build") : (this.mode = "combat");
  }

  getMode() {
    return this.mode;
  }

  getEquippedWeapon() {
    return this.equippedWeapon;
  }

  equipWeapon(id) {
    this.equippedWeapon = id;
  }

  getEquippedConsumable() {
    return this.equippedconsumable;
  }

  equipConsumable(id) {
    this.equippedconsumable = id;
  }
}
