export default class ActionButtonUI {
  constructor(scene) {
    this.scene = scene;

    this.button = scene.add.circle(700, 500, 45, 0x4444ff).setInteractive().setOrigin(0.5).setScrollFactor(0).setDepth(10000); // prettier-ignore
    this.text = scene.add.text(700, 500, "", { fontSize: "16px" }).setOrigin(0.5).setScrollFactor(0).setDepth(10000); // prettier-ignore

    this.button.isUI = true;
  }

  update() {
    const mode = this.scene.equipmentSystem.getMode();

    if (mode === "combat") {
      this.button.setFillStyle(0xaa0000);
      this.text.setText("ATTACK");
    }

    if (mode === "build") {
      this.button.setFillStyle(0x00aa00);
      this.text.setText("BUILD");
    }
  }
}
