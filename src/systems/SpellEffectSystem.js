import HealEffect from "../effects/spellEffects/HealEffect.js";

export default class SpellEffectSystem {
  constructor(scene) {
    this.scene = scene;
  }

  showSpeedCast(target) {}

  showDamageCast(target) {}

  showHealCast(target) {}

  showHeal(target) {
    new HealEffect(this.scene, target);
  }
}
