export default class SpellEffectSystem {
  constructor(scene) {
    this.scene = scene;
  }

  showSpeedCast(caster) {}

  createSpeedAura(target) {
    return new SpeedAura(this.scene, target);
  }

  attachAura(owner, buff) {
    switch (buff.type) {
      case "speed":
        return new SpeedAura(this.scene, owner);

      case "heal":
        return new HealAura(this.scene, owner);

      case "shield":
        return new ShieldAura(this.scene, owner);
    }
  }

  showHeal(target) {}
}
