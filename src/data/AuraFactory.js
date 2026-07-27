import SpeedAura from "../auras/SpeedAura.js";
import HealAura from "../auras/HealAura.js";
import ShieldAura from "../auras/ShieldAura.js";

export default class AuraFactory {
  createAura(scene, owner, buff) {
    switch (buff.type) {
      case "speed":
        return new SpeedAura(scene, owner);

      case "heal":
        return new HealAura(scene, owner);

      case "shield":
        return new ShieldAura(scene, owner);

      default:
        return null;
    }
  }
}
