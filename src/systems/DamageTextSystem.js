import FloatingText from "../ui/FloatingText.js";

export default class DamageTextSystem {
  constructor(scene) {
    this.scene = scene;
  }

  showDamage(x, y, amount, color = "#ffffff") {
    let depth = y;
    x += Phaser.Math.Between(-8, 8);
    y += Phaser.Math.Between(-5, 5);

    new FloatingText(this.scene, x, y, amount.toString(), color, depth);
  }
}
