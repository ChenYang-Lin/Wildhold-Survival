export default class SpellEffectSystem {
  constructor(scene) {
    this.scene = scene;
  }

  showSpeedCast(caster) {}

  createSpeedAura(target) {
    return new SpeedAura(this.scene, target);
  }

  attachAura(owner, buff) {
    return this.scene.auraFactory.createAura(this.scene, owner, buff);
  }

  showHeal(target) {}
}
