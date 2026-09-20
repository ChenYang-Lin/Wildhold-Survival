export default class AttackButtonUI {
  constructor(scene) {
    this.scene = scene;

    this.button = scene.add.circle(700, 500, 55, 0xaa3333).setInteractive().setOrigin(0.5).setScrollFactor(0).setDepth(10000);

    this.text = scene.add
      .text(700, 500, "ATTACK", {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    this.button.isUI = true;
  }

  update() {
    // Visual state can be expanded later.
    // Combat behavior is handled by InputController / combat systems.
  }
}
