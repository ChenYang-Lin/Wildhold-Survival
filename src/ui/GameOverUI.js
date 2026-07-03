export default class GameOverUI {
  constructor(scene) {
    this.scene = scene;
  }

  showGameOverScreen(message) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    this.scene.add
      .text(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY,
        message,
        {
          fontSize: "28px",
          color: "#ff0000",
          align: "center",
          stroke: "#000000",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    const restartButton = this.scene.add
      .text(centerX, centerY + 60, "RESTART", {
        fontSize: "24px",
        backgroundColor: "#333333",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(10001);

    restartButton.on("pointerdown", () => {
      this.scene.scene.restart();
    });

    // dark overlay
    this.scene.add
      .rectangle(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x000000,
        0.7,
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(10000);
  }
}
