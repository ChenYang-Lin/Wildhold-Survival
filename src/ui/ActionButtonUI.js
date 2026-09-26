import { BUILDINGS } from "../data/buildings.js";
import { POTIONS } from "../data/potions.js";

export default class ActionButtonUI {
  constructor(scene) {
    this.scene = scene;

    // --------------------------------------------------
    // SIZE
    // --------------------------------------------------

    this.radius = 38;

    // --------------------------------------------------
    // CONNECTOR
    // Visually connects the action button to the hotbar.
    // --------------------------------------------------

    this.connector = scene.add.rectangle(0, 0, 34, 14, 0x15191e, 0.95).setStrokeStyle(1, 0x5f646b, 0.8).setScrollFactor(0).setDepth(9997);

    this.connectorAccent = scene.add.rectangle(0, 0, 20, 2, 0xf5c542, 0.6).setScrollFactor(0).setDepth(9998);

    // --------------------------------------------------
    // SHADOW
    // --------------------------------------------------

    this.shadow = scene.add
      .circle(0, 4, this.radius + 4, 0x000000, 0.45)
      .setScrollFactor(0)
      .setDepth(9998);

    // --------------------------------------------------
    // OUTER FRAME
    // --------------------------------------------------

    this.outer = scene.add
      .circle(0, 0, this.radius + 3, 0x101318, 1)
      .setScrollFactor(0)
      .setDepth(9999);

    // --------------------------------------------------
    // ACCENT RING
    // --------------------------------------------------

    this.ring = scene.add.circle(0, 0, this.radius, 0x252a30, 1).setStrokeStyle(2, 0xf5c542, 0.85).setScrollFactor(0).setDepth(10000);

    // --------------------------------------------------
    // MAIN BUTTON
    // --------------------------------------------------

    this.button = scene.add
      .circle(0, 0, this.radius - 5, 0x293038, 1)
      .setInteractive({
        useHandCursor: true,
      })
      .setScrollFactor(0)
      .setDepth(10001);

    this.button.isUI = true;

    // --------------------------------------------------
    // INNER HIGHLIGHT
    // --------------------------------------------------

    this.inner = scene.add
      .circle(0, -2, this.radius - 11, 0x20262c, 1)
      .setScrollFactor(0)
      .setDepth(10002);

    // --------------------------------------------------
    // ITEM ICON
    // --------------------------------------------------

    this.icon = scene.add.image(0, -7, "").setScrollFactor(0).setDepth(10003).setVisible(false);

    // --------------------------------------------------
    // ACTION TEXT
    // --------------------------------------------------

    this.text = scene.add
      .text(0, 20, "BUILD", {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10004);

    // --------------------------------------------------
    // E KEY BADGE
    // --------------------------------------------------

    this.keyBackground = scene.add.rectangle(0, 0, 22, 18, 0x111419, 0.98).setStrokeStyle(1, 0xf5c542, 0.9).setScrollFactor(0).setDepth(10005);

    this.keyText = scene.add
      .text(0, 0, "E", {
        fontFamily: "Arial",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#f5c542",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10006);

    this.keyBackground.isUI = true;
    this.keyText.isUI = true;

    // --------------------------------------------------
    // HOVER / PRESS FEEDBACK
    // --------------------------------------------------

    this.button.on("pointerover", () => {
      this.button.setScale(1.04);
      this.inner.setScale(1.04);
    });

    this.button.on("pointerout", () => {
      this.button.setScale(1);
      this.inner.setScale(1);
    });

    this.button.on("pointerdown", () => {
      this.button.setScale(0.95);
      this.inner.setScale(0.95);
    });

    this.button.on("pointerup", () => {
      this.button.setScale(1.04);
      this.inner.setScale(1.04);
    });

    this.resetUIPosition();
  }

  getBounds() {
    return {
      left: this.button.x - this.radius,

      right: this.button.x + this.radius,

      top: this.button.y - this.radius,

      bottom: this.button.y + this.radius,
    };
  }

  update() {
    return;
    const itemId = this.scene.hotbarSystem.getSelectedItem();

    const itemData = this.scene.hotbarSystem.getItemData(itemId);

    if (!itemData) {
      this.button.setFillStyle(0x34383d);
      this.inner.setFillStyle(0x24282d);
      this.ring.setStrokeStyle(2, 0x777777, 0.8);

      this.text.setText("ACTION");
      this.icon.setVisible(false);

      this.resetUIPosition();

      return;
    }

    // --------------------------------------------------
    // BUILDING
    // --------------------------------------------------

    if (BUILDINGS[itemId]) {
      this.button.setFillStyle(0x344a3b);
      this.inner.setFillStyle(0x293b31);

      this.ring.setStrokeStyle(2, 0x78b878, 0.9);

      this.text.setText("BUILD");
    }

    // --------------------------------------------------
    // POTION
    // --------------------------------------------------

    if (POTIONS[itemId]) {
      this.button.setFillStyle(0x4b3438);
      this.inner.setFillStyle(0x3b292d);

      this.ring.setStrokeStyle(2, 0xd97979, 0.9);

      this.text.setText("USE");
    }

    // --------------------------------------------------
    // ICON
    // --------------------------------------------------

    this.icon.setTexture(itemData.icon).setVisible(true);

    const maxWidth = 28;
    const maxHeight = 28;

    const scale = Math.min(maxWidth / itemData.spriteWidth, maxHeight / itemData.spriteHeight);

    this.icon.setScale(scale);

    this.resetUIPosition();
  }

  resetUIPosition() {
    return;
    if (!this.scene.hotbarUI) {
      return;
    }

    const w = this.scene.scale.width;
    const y = this.scene.hotbarUI.getY();

    const hotbarUI = this.scene.hotbarUI;

    // --------------------------------------------------
    // Position relative to the RIGHT ARROW.
    //
    // This is important. Previously the action button
    // was positioned from hotbarRight, which made the
    // action button visually collide with the arrow.
    // --------------------------------------------------

    const arrowRight = hotbarUI.rightButton.x + hotbarUI.arrowWidth / 2;

    const gap = 12;

    const actionX = arrowRight + gap + this.radius;

    // --------------------------------------------------
    // Connector
    // --------------------------------------------------

    const connectorX = arrowRight + gap / 2;

    this.connector.setPosition(connectorX, y);

    this.connectorAccent.setPosition(connectorX, y);

    // --------------------------------------------------
    // Main layers
    // --------------------------------------------------

    this.shadow.setPosition(actionX, y);

    this.outer.setPosition(actionX, y);

    this.ring.setPosition(actionX, y);

    this.button.setPosition(actionX, y);

    this.inner.setPosition(actionX, y - 2);

    // --------------------------------------------------
    // Content
    // --------------------------------------------------

    this.icon.setPosition(actionX, y - 7);

    this.text.setPosition(actionX, y + 20);

    // --------------------------------------------------
    // E badge
    // --------------------------------------------------

    const keyX = actionX + 27;
    const keyY = y + 27;

    this.keyBackground.setPosition(keyX, keyY);

    this.keyText.setPosition(keyX, keyY);

    const showKeyboard = !this.scene.inputController.state.isMobile;

    this.keyBackground.setVisible(showKeyboard);

    this.keyText.setVisible(showKeyboard);
  }
}
