export default class EquipmentSystem {
  constructor(scene) {
    this.scene = scene;

    this.equippedWeapon = "woodenSword";
  }

  getEquippedWeapon() {
    return this.equippedWeapon;
  }

  equipWeapon(id) {
    this.equippedWeapon = id;
  }
}
