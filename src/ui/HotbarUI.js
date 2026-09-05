import { BUILDINGS } from "../data/buildings.js";
import { WEAPONS } from "../data/weapons.js";

export default class HotbarUI {
  constructor(scene) {
    this.scene = scene;

    this.slotWidth = 60;
    this.slotHeight = 60;

    this.selectedSlotWidth = 100;
    this.selectedSlotHeight = 90;

    this.slotSpacing = 8;

    this.arrowWidth = 45;
    this.arrowHeight = 45;

    this.slots = [];

    // Left button
    this.leftButton = this.scene.add.rectangle(0, 0, this.arrowWidth, this.arrowHeight, 0x444444).setScrollFactor(0).setDepth(10000).setInteractive({
      useHandCursor: true,
    });

    this.leftButton.isUI = true;

    this.leftButtonText = this.scene.add
      .text(0, 0, "<", {
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    // Right button
    this.rightButton = this.scene.add.rectangle(0, 0, this.arrowWidth, this.arrowHeight, 0x444444).setScrollFactor(0).setDepth(10000).setInteractive({
      useHandCursor: true,
    });

    this.rightButton.isUI = true;

    this.rightButtonText = this.scene.add
      .text(0, 0, ">", {
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    // Previous item
    this.leftButton.on("pointerdown", () => {
      console.log("LEFT BUTTON CLICKED");

      this.scene.hotbarSystem.previous();
      this.update();
    });

    // Next item
    this.rightButton.on("pointerdown", () => {
      console.log("RIGHT BUTTON CLICKED");

      this.scene.hotbarSystem.next();
      this.update();
    });

    this.leftButton.on("pointerover", () => {
      console.log("LEFT BUTTON HOVER");
    });

    this.leftButton.on("pointerout", () => {
      console.log("LEFT BUTTON OUT");
    });

    this.resetUIPosition();
  }

  createSlot(index) {
    const background = this.scene.add
      .rectangle(0, 0, this.slotWidth, this.slotHeight, 0x333333)
      .setScrollFactor(0)
      .setDepth(10000)
      .setInteractive({ useHandCursor: true });

    background.isUI = true;

    const nameText = this.scene.add
      .text(0, 0, "", {
        fontSize: "13px",
        color: "#ffffff",
        align: "center",
        wordWrap: {
          width: this.selectedSlotWidth - 12,
        },
        maxLines: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10002);

    const icon = this.scene.add.image(0, 0, "").setScrollFactor(0).setDepth(10001);

    const costText = this.scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "normal",
        color: "#ffffff",
        align: "center",
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: "#000000",
          blur: 0,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    background.on("pointerdown", () => {
      console.log("HOTBAR SLOT CLICKED:", index);
      this.scene.hotbarSystem.select(index);
      this.update();
    });

    return {
      background,
      nameText,
      icon,
      costText,
    };
  }

  update() {
    const items = this.scene.hotbarSystem.getItems();
    const selectedIndex = this.scene.hotbarSystem.getSelectedIndex();

    while (this.slots.length < items.length) {
      this.slots.push(this.createSlot(this.slots.length));
    }

    const centerX = this.getCenterX();
    const y = this.getY();

    // Calculate total width using each slot's current size
    let totalWidth = 0;

    for (let i = 0; i < items.length; i++) {
      const isSelected = i === selectedIndex;

      const width = isSelected ? this.selectedSlotWidth : this.slotWidth;

      totalWidth += width;

      if (i < items.length - 1) {
        totalWidth += this.slotSpacing;
      }
    }

    let currentX = centerX - totalWidth / 2;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];

      if (i >= items.length) {
        slot.background.setVisible(false);
        slot.nameText.setVisible(false);
        slot.icon.setVisible(false);
        slot.costText.setVisible(false);
        continue;
      }
      const isSelected = i === selectedIndex;

      const width = isSelected ? this.selectedSlotWidth : this.slotWidth;

      const height = isSelected ? this.selectedSlotHeight : this.slotHeight;

      const x = currentX + width / 2;

      slot.background.setPosition(x, y).setSize(width, height).setVisible(true);

      const itemId = items[i];
      const recipe = BUILDINGS[itemId];
      const weaponIcon = WEAPONS[itemId];

      // Slot content
      const itemData = recipe || weaponIcon;

      // Item name
      slot.nameText
        .setPosition(x, y - height / 2 + 12)
        .setText(isSelected && itemData ? itemData.name : "")
        .setVisible(isSelected);

      // Item Icon
      this.setSlotIcon(slot, itemData, isSelected, x, y, width, height);

      // Item cost
      slot.costText
        .setPosition(x, y + height / 2 - 17)
        .setText(isSelected && recipe ? this.getCostText(recipe.cost) : "")
        .setVisible(isSelected && !!recipe);

      // Slot background
      if (isSelected) {
        slot.background.setFillStyle(0x444444).setStrokeStyle(3, 0xf5c542);

        slot.nameText.setColor("#ffffff");
      } else {
        slot.background.setFillStyle(0x333333).setStrokeStyle(1, 0x666666);
      }

      currentX += width + this.slotSpacing;
    }

    this.resetUIPosition();
  }

  getCenterX() {
    return this.scene.scale.width / 2;
  }

  getY() {
    return this.scene.scale.height - 60;
  }

  getTotalSlotWidth(items) {
    const selectedIndex = this.scene.hotbarSystem.getSelectedIndex();

    let totalWidth = 0;

    for (let i = 0; i < items.length; i++) {
      totalWidth += i === selectedIndex ? this.selectedSlotWidth : this.slotWidth;

      if (i < items.length - 1) {
        totalWidth += this.slotSpacing;
      }
    }

    return totalWidth;
  }

  getCostText(cost) {
    return Object.entries(cost)
      .map(([resource, amount]) => `${resource} x ${amount}`)
      .join("\n");
  }

  setSlotIcon(slot, itemData, isSelected, x, y, width, height) {
    if (!itemData) {
      slot.icon.setVisible(false);
      return;
    }

    const maxIconWidth = isSelected ? width - 20 : width - 12;

    const maxIconHeight = isSelected ? height - 45 : height - 12;

    const scale = Math.min(maxIconWidth / itemData.spriteWidth, maxIconHeight / itemData.spriteHeight);

    slot.icon.setTexture(itemData.icon).setPosition(x, y).setScale(scale).setVisible(true);
  }

  resetUIPosition() {
    const centerX = this.getCenterX();
    const y = this.getY();

    const items = this.scene.hotbarSystem.getItems();

    const totalWidth = this.getTotalSlotWidth(items);

    const leftX = centerX - totalWidth / 2 - this.arrowWidth / 2 - 10;

    const rightX = centerX + totalWidth / 2 + this.arrowWidth / 2 + 10;

    this.leftButton.setPosition(leftX, y);
    this.leftButtonText.setPosition(leftX, y);

    this.rightButton.setPosition(rightX, y);
    this.rightButtonText.setPosition(rightX, y);
  }
}
