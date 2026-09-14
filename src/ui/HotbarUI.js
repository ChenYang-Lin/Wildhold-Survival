import { BUILDINGS } from "../data/buildings.js";
import { WEAPONS } from "../data/weapons.js";
import { POTIONS } from "../data/potions.js";
import { RESOURCES } from "../data/resources.js";

export default class HotbarUI {
  constructor(scene) {
    this.scene = scene;

    this.slotWidth = 60;
    this.slotHeight = 60;

    this.selectedSlotWidth = 100;
    this.selectedSlotHeight = 100;

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

    const resourceCosts = [];

    background.on("pointerdown", () => {
      console.log("HOTBAR SLOT CLICKED:", index);
      this.scene.hotbarSystem.select(index);
      this.update();
    });

    return {
      background,
      nameText,
      icon,
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

      if (i >= items.length) {
        slot.background.setVisible(false);
        slot.nameText.setVisible(false);
        slot.icon.setVisible(false);

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

      const itemId = items[i];

      const recipe = BUILDINGS[itemId] || POTIONS[itemId];
      const weapon = WEAPONS[itemId];

      // Slot content
      const itemData = recipe || weapon;

      // Item name
      slot.nameText
        .setPosition(x, y - height / 2 + 12)
        .setText(isSelected && itemData ? itemData.name : "")
        .setVisible(isSelected);

      // Item Icon
      this.setSlotIcon(slot, itemData, isSelected, x, y, width, height);

      // Item cost
      if (isSelected && recipe) {
        if (recipe?.cost) {
          this.updateResourceCosts(slot, recipe.cost, x, y + height / 2 - 20);
        }
      } else {
        for (const entry of slot.resourceCosts) {
          entry.icon.setVisible(false);
          entry.text.setVisible(false);
        }
      }

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

  updateResourceCosts(slot, cost, x, y) {
    const resources = Object.entries(cost);

    while (slot.resourceCosts.length < resources.length) {
      slot.resourceCosts.push(this.createResourceCost());
    }

    const entries = [];

    // Prepare visible resource entries
    for (let i = 0; i < resources.length; i++) {
      const [resourceId, requiredAmount] = resources[i];

      const resourceData = RESOURCES[resourceId];

      if (!resourceData) {
        continue;
      }

      const inventoryItem = this.scene.inventorySystem.inventory.find((item) => item?.id === resourceId);

      const currentAmount = inventoryItem?.amount ?? 0;

      const text = `${requiredAmount}/${currentAmount}`;

      const entry = slot.resourceCosts[i];

      entry.icon.setTexture(resourceData.icon).setDisplaySize(16, 16);

      const canAfford = currentAmount >= requiredAmount;

      entry.text.setText(text).setColor(canAfford ? "#ffffff" : "#ff4444");

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
      return;
    }

    // Layout settings
    const iconSize = 16;
    const iconTextGap = 4;
    const entrySpacing = 12;

    // Calculate total width of the entire resource group
    let totalWidth = 0;

    for (const item of entries) {
      totalWidth += iconSize + iconTextGap + item.textWidth;
    }

    totalWidth += entrySpacing * (entries.length - 1);

    // Start at the left edge of the centered group
    let currentX = x - totalWidth / 2;

    for (const item of entries) {
      const { entry, textWidth } = item;

      entry.icon.setPosition(currentX + iconSize / 2, y).setVisible(true);

      entry.text.setPosition(currentX + iconSize + iconTextGap, y).setVisible(true);

      currentX += iconSize + iconTextGap + textWidth + entrySpacing;
    }
  }

  getCenterX() {
    return this.scene.scale.width / 2;
  }

  getY() {
    return this.scene.scale.height - 60;
  }

  createResourceCost() {
    const icon = this.scene.add.image(0, 0, "").setScrollFactor(0).setDepth(10002);

    const text = this.scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "normal",
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

    const maxIconWidth = isSelected ? width - 20 : width - 12;

    const maxIconHeight = isSelected ? height - 45 : height - 12;

    const scale = Math.min(maxIconWidth / itemData.spriteWidth, maxIconHeight / itemData.spriteHeight);

    const iconY = y + 5;

    slot.icon.setTexture(itemData.icon).setPosition(x, iconY).setScale(scale).setVisible(true);
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
