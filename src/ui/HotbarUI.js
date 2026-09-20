import { BUILDINGS } from "../data/buildings.js";
import { POTIONS } from "../data/potions.js";
import { RESOURCES } from "../data/resources.js";

export default class HotbarUI {
  constructor(scene) {
    this.scene = scene;

    this.dock = this.scene.add.graphics().setScrollFactor(0).setDepth(9990);
    this.dockHighlight = this.scene.add.graphics().setScrollFactor(0).setDepth(9991);

    this.slotWidth = 56;
    this.slotHeight = 56;

    this.selectedSlotWidth = 94;
    this.selectedSlotHeight = 86;

    this.slotSpacing = 7;

    this.arrowWidth = 40;
    this.arrowHeight = 40;

    this.slots = [];

    // Left button
    this.leftButton = this.scene.add
      .circle(0, 0, this.arrowWidth / 2, 0x171b20, 0.96)
      .setStrokeStyle(2, 0x555d66, 0.9)
      .setScrollFactor(0)
      .setDepth(10000)
      .setInteractive({
        useHandCursor: true,
      });

    this.leftButton.isUI = true;

    this.leftButtonText = this.scene.add
      .text(0, 0, "<", {
        fontSize: "24px",
        fontStyle: "bold",
        color: "#d9dde2",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    // Right button
    this.rightButton = this.scene.add
      .circle(0, 0, this.arrowWidth / 2, 0x171b20, 0.96)
      .setStrokeStyle(2, 0x555d66, 0.9)
      .setScrollFactor(0)
      .setDepth(10000)
      .setInteractive({
        useHandCursor: true,
      });

    this.rightButton.isUI = true;

    this.rightButtonText = this.scene.add
      .text(0, 0, ">", {
        fontSize: "24px",
        fontStyle: "bold",
        color: "#d9dde2",
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

    // Pointer over visual effects
    this.leftButton.on("pointerover", () => {
      this.leftButton.setFillStyle(0x292f36);
    });

    this.leftButton.on("pointerout", () => {
      this.leftButton.setFillStyle(0x171b20);
    });

    this.rightButton.on("pointerover", () => {
      this.rightButton.setFillStyle(0x292f36);
    });

    this.rightButton.on("pointerout", () => {
      this.rightButton.setFillStyle(0x171b20);
    });

    this.resetUIPosition();
  }

  createSlot(index) {
    const shadow = this.scene.add
      .rectangle(0, 4, this.slotWidth + 4, this.slotHeight + 4, 0x000000, 0.45)
      .setScrollFactor(0)
      .setDepth(9999);

    const costBackground = this.scene.add.rectangle(0, 0, 50, 18, 0x101419, 0.95).setStrokeStyle(1, 0x4f565e, 0.9).setScrollFactor(0).setDepth(10002);

    const background = this.scene.add
      .rectangle(0, 0, this.slotWidth, this.slotHeight, 0x252525)
      .setScrollFactor(0)
      .setDepth(10000)
      .setInteractive({ useHandCursor: true });

    background.isUI = true;

    // Icon frame
    const iconFrame = this.scene.add.rectangle(0, 0, 40, 40, 0x15191e, 0.9).setStrokeStyle(1, 0x454c55, 0.9).setScrollFactor(0).setDepth(10001);

    const nameText = this.scene.add
      .text(0, 0, "", {
        fontSize: "11px",
        fontFamily: "Arial",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10003);

    const icon = this.scene.add.image(0, 0, "").setScrollFactor(0).setDepth(10001);

    const resourceCosts = [];

    background.on("pointerdown", () => {
      this.scene.hotbarSystem.select(index);
      this.update();
    });

    return {
      shadow,
      background,
      iconFrame,
      nameText,
      icon,
      costBackground,
      resourceCosts,
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

      // Hiding slots
      if (i >= items.length) {
        slot.shadow.setVisible(false);
        slot.background.setVisible(false);
        slot.iconFrame.setVisible(false);
        slot.nameText.setVisible(false);
        slot.icon.setVisible(false);
        slot.costBackground.setVisible(false);

        for (const entry of slot.resourceCosts) {
          entry.icon.setVisible(false);
          entry.text.setVisible(false);
        }

        continue;
      }
      const isSelected = i === selectedIndex;

      const width = isSelected ? this.selectedSlotWidth : this.slotWidth;

      const height = isSelected ? this.selectedSlotHeight : this.slotHeight;

      const x = currentX + width / 2;

      slot.background.setPosition(x, y).setSize(width, height).setVisible(true);

      if (isSelected) {
        slot.iconFrame
          .setPosition(x, y + 3)
          .setSize(54, 42)
          .setVisible(true);
      } else {
        slot.iconFrame.setPosition(x, y).setSize(40, 40).setVisible(true);
      }

      slot.shadow
        .setPosition(x, y + 3)
        .setSize(width + 4, height + 4)
        .setVisible(true);

      const itemId = items[i];

      // Slot content
      const itemData = BUILDINGS[itemId] || POTIONS[itemId];

      // Item name
      slot.nameText
        .setPosition(x, y - height / 2 + 11)
        .setFontSize("11px")
        .setText(isSelected && itemData ? itemData.name : "")
        .setVisible(isSelected);

      // Item Icon
      this.setSlotIcon(slot, itemData, isSelected, x, y, width, height);

      // Item cost
      slot.costBackground.setVisible(false);

      for (const entry of slot.resourceCosts) {
        entry.icon.setVisible(false);
        entry.text.setVisible(false);
      }

      if (isSelected && itemData?.cost) {
        this.updateResourceCosts(slot, itemData.cost, x, y + height / 2 - 12);
      }

      // Slot background
      if (isSelected) {
        slot.background.setFillStyle(0x252a30).setStrokeStyle(3, 0xf5c542, 1);

        slot.iconFrame.setFillStyle(0x15191e).setStrokeStyle(1, 0x8b7430, 0.9);

        slot.shadow.setFillStyle(0x000000, 0.6);

        slot.nameText.setColor("#f5c542");
      } else {
        slot.background.setFillStyle(0x171b20).setStrokeStyle(1, 0x454c55, 0.9);

        slot.iconFrame.setFillStyle(0x111419).setStrokeStyle(1, 0x343a42, 0.8);

        slot.shadow.setFillStyle(0x000000, 0.4);
      }

      currentX += width + this.slotSpacing;
    }

    this.resetUIPosition();
  }

  updateResourceCosts(slot, cost, x, y) {
    const resources = Object.entries(cost);

    while (slot.resourceCosts.length < resources.length) {
      slot.resourceCosts.push(this.createResourceCost());
    }

    const entries = [];

    for (let i = 0; i < resources.length; i++) {
      const [resourceId, requiredAmount] = resources[i];

      const resourceData = RESOURCES[resourceId];

      if (!resourceData) {
        continue;
      }

      const inventoryItem = this.scene.inventorySystem.inventory.find((item) => item?.id === resourceId);

      const currentAmount = inventoryItem?.amount ?? 0;

      const entry = slot.resourceCosts[i];

      const canAfford = currentAmount >= requiredAmount;

      entry.icon.setTexture(resourceData.icon).setDisplaySize(14, 14);

      entry.text.setText(`${requiredAmount}/${currentAmount}`).setColor(canAfford ? "#ffffff" : "#ff5555");

      entries.push({
        entry,
        textWidth: entry.text.width,
      });
    }

    // Hide unused entries
    for (let i = resources.length; i < slot.resourceCosts.length; i++) {
      slot.resourceCosts[i].icon.setVisible(false);
      slot.resourceCosts[i].text.setVisible(false);
    }

    if (entries.length === 0) {
      slot.costBackground.setVisible(false);
      return;
    }

    const iconSize = 14;
    const gap = 3;
    const spacing = 8;

    let totalWidth = 0;

    for (const item of entries) {
      totalWidth += iconSize + gap + item.textWidth;
    }

    totalWidth += spacing * (entries.length - 1);

    // Add padding inside the pill
    const pillWidth = totalWidth + 12;

    slot.costBackground.setPosition(x, y).setSize(Math.max(pillWidth, 42), 18).setVisible(true);

    let currentX = x - totalWidth / 2;

    for (const item of entries) {
      const { entry, textWidth } = item;

      entry.icon.setPosition(currentX + iconSize / 2, y).setVisible(true);

      entry.text.setPosition(currentX + iconSize + gap, y).setVisible(true);

      currentX += iconSize + gap + textWidth + spacing;
    }
  }

  getCenterX() {
    return this.scene.scale.width / 2;
  }

  getY() {
    return this.scene.scale.height - 85;
  }

  createResourceCost() {
    const icon = this.scene.add.image(0, 0, "").setScrollFactor(0).setDepth(10002);

    const text = this.scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#ffffff",
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: "#000000",
          blur: 0,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(10002);

    return {
      icon,
      text,
    };
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

  setSlotIcon(slot, itemData, isSelected, x, y, width, height) {
    if (!itemData) {
      slot.icon.setVisible(false);
      return;
    }

    const maxIconWidth = isSelected ? 34 : 32;

    const maxIconHeight = isSelected ? 34 : 32;

    const scale = Math.min(maxIconWidth / itemData.spriteWidth, maxIconHeight / itemData.spriteHeight);

    const iconY = isSelected ? y + 2 : y;

    slot.icon.setTexture(itemData.icon).setPosition(x, iconY).setScale(scale).setVisible(true);
  }

  updateDock() {
    const centerX = this.getCenterX();
    const y = this.getY();

    const items = this.scene.hotbarSystem.getItems();

    const totalWidth = this.getTotalSlotWidth(items);

    const leftArrowEdge = this.leftButton.x - this.arrowWidth / 2;

    const rightArrowEdge = this.rightButton.x + this.arrowWidth / 2;

    // The action button is owned by InputController,
    // so use its current position if it exists.
    const actionButton = this.scene.inputController?.actionButtonUI;

    let rightEdge = rightArrowEdge;

    if (actionButton) {
      rightEdge = actionButton.button.x + actionButton.radius;
    }

    const leftEdge = leftArrowEdge;

    const width = rightEdge - leftEdge;

    const height = 96;

    const x = leftEdge + width / 2;

    // --------------------------------------------------
    // Main dock
    // --------------------------------------------------

    this.dock.clear();

    this.dock.fillStyle(0x11161b, 0.88).fillRoundedRect(x - width / 2, y - height / 2, width, height, 18);

    this.dock.lineStyle(1, 0x4a5159, 0.9).strokeRoundedRect(x - width / 2, y - height / 2, width, height, 18);

    // --------------------------------------------------
    // Inner highlight
    // --------------------------------------------------

    this.dockHighlight.clear();

    this.dockHighlight.lineStyle(1, 0x242a31, 0.8).strokeRoundedRect(x - width / 2 + 3, y - height / 2 + 3, width - 6, height - 6, 15);
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

    this.updateDock();
  }
}
