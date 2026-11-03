import { WEAPONS } from "../data/weapons.js";

export default class EquipmentSystem {
  constructor(scene) {
    this.scene = scene;

    // Temporary test ownership.
    this.ownedWeapons = new Set(["woodenSword", "ironSword"]);

    this.equippedWeapon = "woodenSword";
  }

  getEquippedWeapon() {
    return WEAPONS[this.equippedWeapon];
  }

  getOwnedWeapons() {
    return [...this.ownedWeapons].map((id) => WEAPONS[id]);
  }

  ownsWeapon(id) {
    return this.ownedWeapons.has(id);
  }

  equipWeapon(id) {
    if (!this.ownsWeapon(id)) return false;
    if (!WEAPONS[id]) return false;

    this.equippedWeapon = id;

    this.scene.player.stats.refreshStats();

    return true;
  }

  unlockWeapon(id) {
    if (!WEAPONS[id]) return false;

    this.ownedWeapons.add(id);

    return true;
  }
}
