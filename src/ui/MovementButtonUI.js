export default class MovementButtonUI {
  constructor(scene) {
    this.scene = scene;

    this.button = scene.add.circle(600, 500, 45, 0x4444ff).setInteractive().setOrigin(0.5).setScrollFactor(0).setDepth(10000);

    this.text = scene.add
      .text(600, 500, "DASH", {
        fontSize: "16px",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);

    this.button.isUI = true;
  }
}
