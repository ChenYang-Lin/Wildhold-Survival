export default class AttackButtonUI {
  constructor(scene) {
    this.scene = scene;

    this.button = scene.add.circle(700, 500, 55, 0xaa3333).setInteractive().setOrigin(0.5).setScrollFactor(0).setDepth(10000);

    this.highlightRing = scene.add.circle(700, 500, 61, 0xffff00, 0).setStrokeStyle(4, 0xffff00, 1).setScrollFactor(0).setDepth(9999).setVisible(false);

    this.isTutorialHighlighted = false;

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

  setTutorialHighlight(enabled) {
    if (this.isTutorialHighlighted === enabled) return;

    this.isTutorialHighlighted = enabled;

    this.scene.tweens.killTweensOf(this.highlightRing);

    if (enabled) {
      this.highlightRing.setVisible(true).setAlpha(1).setScale(1);

      this.scene.tweens.add({
        targets: this.highlightRing,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.4,
        duration: 600,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.highlightRing.setVisible(false).setAlpha(1).setScale(1);
    }
  }

  update() {
    // Visual state can be expanded later.
    // Combat behavior is handled by InputController / combat systems.
  }
}
