import BaseAura from "./BaseAura.js";

export default class SpeedAura extends BaseAura {
  constructor(scene, owner) {
    super(scene, owner);

    this.LINE_COUNT = 6;
    this.RADIUS = 14;
    this.LINE_WIDTH = 4;
    this.LINE_HEIGHT = 12;
    this.COLOR = 0x88ff88;

    this.lines = [];

    this.createLines();

    this.pulseTween = scene.tweens.add({
      targets: this.container,
      scale: 1.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createLines() {
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad((360 / this.LINE_COUNT) * i);

      const line = this.scene.add.rectangle(Math.cos(angle) * this.RADIUS, Math.sin(angle) * this.RADIUS, this.LINE_WIDTH, this.LINE_HEIGHT, this.COLOR);

      line.rotation = angle;

      this.container.add(line);

      this.lines.push(line);
    }
  }

  destroy() {
    super.destroy();

    this.pulseTween.destroy();
  }

  update() {
    super.update();

    console.log("updating aura");
    this.container.rotation += 0.05;
  }
}
