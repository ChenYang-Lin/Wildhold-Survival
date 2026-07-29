import BuffAura from "../effects/auras/BuffAura.js";

export default class AuraFactory {
  createAura(scene, owner, buff) {
    switch (buff.effectType) {
      case "speed":
        return new BuffAura(scene, owner, {
          color: 0xffffff,
        });

      case "damage":
        return new BuffAura(scene, owner, {
          color: 0xff4444,
        });

      case "defense":
        return new BuffAura(scene, owner, {
          color: 0x4488ff,
        });

      default:
        return null;
    }
  }
}
