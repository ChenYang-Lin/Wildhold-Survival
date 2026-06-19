export default class HotbarUI {
  constructor(scene) {
    this.scene = scene;

    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);

    this.itemText = this.scene.add.text(445, this.scene.scale.height - 50, "", { fontSize: "24px", color: "#ffff00" }).setOrigin(0.5).setScrollFactor(0).setDepth(10000); // prettier-ignore

    this.container.add(this.itemText);

    // Combat-Building Button
    this.combatButton = this.scene.add.rectangle(390, this.scene.scale.height - 100, 100, 40, 0xaa3333).setInteractive().setScrollFactor(0).setDepth(10000); //prettier-ignore
    this.combatText = this.scene.add.text(390, this.scene.scale.height - 100, "Combat", { fontSize: "18px", color: "#ffffff" }).setOrigin(0.5).setScrollFactor(0).setDepth(10000); // prettier-ignore
    this.combatButton.isUI = true;

    this.buildButton = this.scene.add.rectangle(500, this.scene.scale.height - 100, 100, 40, 0x33aa33).setInteractive().setScrollFactor(0).setDepth(10000); //prettier-ignore
    this.buildText = this.scene.add.text(500, this.scene.scale.height - 100, "Build", { fontSize: "18px", color: "#ffffff" }).setOrigin(0.5).setScrollFactor(0).setDepth(10000); // prettier-ignore
    this.buildButton.isUI = true;

    // Left/Right buttons - for switch items
    this.leftButton = this.scene.add.rectangle(320, this.scene.scale.height - 50, 50, 50, 0x444444).setInteractive().setScrollFactor(0).setDepth(10000); //prettier-ignore
    this.leftButtonText = this.scene.add.text(320, this.scene.scale.height - 50, "<", { fontSize: "28px", color: "#ffffff" }).setOrigin(0.5).setScrollFactor(0).setDepth(10000); // prettier-ignore
    this.leftButton.isUI = true;

    this.rightButton = this.scene.add.rectangle(570, this.scene.scale.height - 50, 50, 50, 0x444444).setInteractive().setScrollFactor(0).setDepth(10000); //prettier-ignore
    this.rightButtonText = this.scene.add.text(570, this.scene.scale.height - 50, ">", { fontSize: "28px", color: "#ffffff" }).setOrigin(0.5).setScrollFactor(0).setDepth(10000); // prettier-ignore
    this.rightButton.isUI = true;

    this.combatButton.on("pointerdown", () => {
      this.scene.equipmentSystem.setMode("combat");
    });

    this.buildButton.on("pointerdown", () => {
      this.scene.equipmentSystem.setMode("build");
    });

    this.leftButton.on("pointerdown", () => {
      this.scene.hotbarSystem.previous();
    });

    this.rightButton.on("pointerdown", () => {
      this.scene.hotbarSystem.next();
    });

    this.resetUIPosition();
  }

  resetUIPosition() {
    const w = Math.min(this.scene.scale.width, window.innerWidth);

    const h = Math.min(this.scene.scale.height, window.innerHeight);

    const bottomOffset = 30;

    this.itemText.setPosition(w / 2, h - 30 - bottomOffset);

    this.combatButton.setPosition(w / 2 - 55, h - 80 - bottomOffset);

    this.combatText.setPosition(w / 2 - 55, h - 80 - bottomOffset);

    this.buildButton.setPosition(w / 2 + 55, h - 80 - bottomOffset);

    this.buildText.setPosition(w / 2 + 55, h - 80 - bottomOffset);

    this.leftButton.setPosition(w / 2 - 125, h - 30 - bottomOffset);

    this.leftButtonText.setPosition(w / 2 - 125, h - 30 - bottomOffset);

    this.rightButton.setPosition(w / 2 + 125, h - 30 - bottomOffset);

    this.rightButtonText.setPosition(w / 2 + 125, h - 30 - bottomOffset);
  }

  update() {
    const mode = this.scene.equipmentSystem.getMode();

    if (mode === "combat") {
      this.combatButton.fillColor = 0xff4444;
      this.buildButton.fillColor = 0x444444;
    } else {
      this.combatButton.fillColor = 0x444444;
      this.buildButton.fillColor = 0x44ff44;
    }

    const selected = this.scene.hotbarSystem.getSelectedItem();

    this.itemText.setText(selected || "None");
  }
}
