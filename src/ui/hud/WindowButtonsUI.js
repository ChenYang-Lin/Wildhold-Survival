export default class WindowButtonsUI {
  constructor(scene) {
    this.scene = scene;
    this.buttons = [];

    this.create();

    this.resetUIPosition();

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  create() {
    this.equipmentButton = this.createButton("EQ", () => {
      this.scene.equipmentWindow.toggle();
    });

    this.inventoryButton = this.createButton("INV", () => {
      this.scene.inventoryWindow.toggle();
    });

    this.buttons.push(this.equipmentButton, this.inventoryButton);
  }

  createButton(label, onClick) {
    const button = this.scene.add
      .rectangle(0, 0, 52, 44, 0x22282f, 0.95)
      .setStrokeStyle(1, 0x6b737c)
      .setScrollFactor(0)
      .setDepth(12000)
      .setInteractive({ useHandCursor: true });

    // Prevent this button from being interpreted as a gameplay input.
    button.isUI = true;

    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Arial",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(12001);

    text.isUI = true;

    button.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation();
      onClick();
    });

    return { button, text };
  }

  resetUIPosition() {
    const width = this.scene.scale.width;
    const margin = 12;

    const x = width - margin - 26;

    // Stack the buttons vertically in the upper-right corner.
    this.equipmentButton.button.setPosition(x, 38);
    this.equipmentButton.text.setPosition(x, 38);

    this.inventoryButton.button.setPosition(x, 92);
    this.inventoryButton.text.setPosition(x, 92);
  }

  destroy() {
    for (const item of this.buttons) {
      item.button?.destroy();
      item.text?.destroy();
    }

    this.buttons = [];
  }
}
