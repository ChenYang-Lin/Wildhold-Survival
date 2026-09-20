import { BUILDINGS } from "../data/buildings.js";
import { HUD_CONFIG } from "../data/hudConfig.js";
import { POTIONS } from "../data/potions.js";
import { RESOURCES } from "../data/resources.js";

export default class HotbarUI {
  constructor(scene) {
    this.scene = scene;

    this.dock = this.scene.add.graphics().setScrollFactor(0).setDepth(9990);

    this.dockHighlight = this.scene.add.graphics().setScrollFactor(0).setDepth(9991);

    this.isMobile = scene.sys.game.device.input.touch;

    this.config = this.isMobile ? HUD_CONFIG.mobile : HUD_CONFIG.desktop;

    this.panelWidth = this.config.panelWidth;
    this.panelHeight = this.config.panelHeight;

    this.slotWidth = this.config.slotWidth;
    this.slotHeight = this.config.slotHeight;

    this.selectedSlotWidth = this.config.selectedSlotWidth;

    this.selectedSlotHeight = this.config.selectedSlotHeight;

    this.slotSpacing = this.config.slotSpacing;

    this.arrowWidth = this.config.arrowWidth;
    this.arrowHeight = this.config.arrowHeight;

    this.panelPadding = this.config.panelPadding;
    this.viewportPadding = this.config.viewportPadding;

    this.actionGap = this.config.actionGap;

    this.slots = [];

    this.scrollIndex = 0;

    this.viewportLeft = 0;
    this.viewportRight = 0;
    this.viewportWidth = 0;

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

  createSlot() {
    const shadow = this.scene.add
      .rectangle(0, 4, this.slotWidth + 4, this.slotHeight + 4, 0x000000, 0.45)
      .setScrollFactor(0)
      .setDepth(9999);

    const costBackground = this.scene.add.rectangle(0, 0, 50, 18, 0x101419, 0.95).setStrokeStyle(1, 0x4f565e, 0.9).setScrollFactor(0).setDepth(10002);

    const background = this.scene.add.rectangle(0, 0, this.slotWidth, this.slotHeight, 0x252525).setScrollFactor(0).setDepth(10000).setInteractive({
      useHandCursor: true,
    });

    background.isUI = true;

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

    const slot = {
      shadow,
      background,
      iconFrame,
      nameText,
      icon,
      costBackground,
      resourceCosts,

      // The actual HotbarSystem index this visual slot represents.
      itemIndex: -1,
    };

    background.on("pointerdown", () => {
      if (slot.itemIndex === -1) return;

      this.scene.hotbarSystem.select(slot.itemIndex);
      this.update();
    });

    return slot;
  }

  getDockHeight() {
    return this.panelHeight;
  }

  getItemWidth(index, selectedIndex) {
    return index === selectedIndex ? this.selectedSlotWidth : this.slotWidth;
  }

  getVisibleRange(items, selectedIndex) {
    let width = 0;
    let end = this.scrollIndex;

    for (let i = this.scrollIndex; i < items.length; i++) {
      const itemWidth = this.getItemWidth(i, selectedIndex);

      const spacing = i === this.scrollIndex ? 0 : this.slotSpacing;

      if (width + spacing + itemWidth > this.viewportWidth) {
        break;
      }

      width += spacing + itemWidth;
      end = i + 1;
    }

    return {
      start: this.scrollIndex,
      end,
    };
  }

  ensureSelectedVisible(items, selectedIndex) {
    if (items.length === 0) {
      this.scrollIndex = 0;
      return;
    }

    // Selected item is before the viewport.
    if (selectedIndex < this.scrollIndex) {
      this.scrollIndex = selectedIndex;
    }

    let range = this.getVisibleRange(items, selectedIndex);

    // Selected item is after the viewport.
    if (selectedIndex >= range.end) {
      this.scrollIndex = selectedIndex;

      range = this.getVisibleRange(items, selectedIndex);
    }

    // Don't allow scrolling past the final item.
    if (range.end >= items.length) {
      while (this.scrollIndex > 0) {
        const testStart = this.scrollIndex - 1;

        let width = 0;
        let end = testStart;

        for (let i = testStart; i < items.length; i++) {
          const itemWidth = this.getItemWidth(i, selectedIndex);

          const spacing = i === testStart ? 0 : this.slotSpacing;

          if (width + spacing + itemWidth > this.viewportWidth) {
            break;
          }

          width += spacing + itemWidth;
          end = i + 1;
        }

        if (end < items.length) {
          break;
        }

        this.scrollIndex = testStart;
      }
    }
  }

  update() {
    const items = this.scene.hotbarSystem.getItems();
    const selectedIndex = this.scene.hotbarSystem.getSelectedIndex();

    // Make sure the selected item can be seen.
    this.ensureSelectedVisible(items, selectedIndex);

    const range = this.getVisibleRange(items, selectedIndex);

    while (this.slots.length < items.length) {
      this.slots.push(this.createSlot());
    }

    const y = this.getY();

    // Calculate width of visible items.
    let visibleWidth = 0;

    for (let i = range.start; i < range.end; i++) {
      const isSelected = i === selectedIndex;

      visibleWidth += isSelected ? this.selectedSlotWidth : this.slotWidth;

      if (i < range.end - 1) {
        visibleWidth += this.slotSpacing;
      }
    }

    // Center visible items inside the viewport.
    let currentX = this.viewportLeft + (this.viewportWidth - visibleWidth) / 2;

    for (let slotIndex = 0; slotIndex < this.slots.length; slotIndex++) {
      const slot = this.slots[slotIndex];

      // This visual slot isn't currently being used.
      if (slotIndex < range.start || slotIndex >= range.end) {
        slot.itemIndex = -1;

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

      // The actual item represented by this visual slot.
      const itemIndex = slotIndex;

      slot.itemIndex = itemIndex;

      const isSelected = itemIndex === selectedIndex;

      const width = isSelected ? this.selectedSlotWidth : this.slotWidth;

      const height = isSelected ? this.selectedSlotHeight : this.slotHeight;

      const x = currentX + width / 2;

      // --------------------------------------------------
      // BACKGROUND
      // --------------------------------------------------

      slot.background.setPosition(x, y).setSize(width, height).setVisible(true);

      // --------------------------------------------------
      // ICON FRAME
      // --------------------------------------------------

      if (isSelected) {
        slot.iconFrame
          .setPosition(x, y + 3)
          .setSize(54, 42)
          .setVisible(true);
      } else {
        slot.iconFrame.setPosition(x, y).setSize(40, 40).setVisible(true);
      }

      // --------------------------------------------------
      // SHADOW
      // --------------------------------------------------

      slot.shadow
        .setPosition(x, y + 3)
        .setSize(width + 4, height + 4)
        .setVisible(true);

      // --------------------------------------------------
      // ITEM
      // --------------------------------------------------

      const itemId = items[itemIndex];

      const itemData = BUILDINGS[itemId] || POTIONS[itemId];

      // --------------------------------------------------
      // NAME
      // --------------------------------------------------

      slot.nameText
        .setPosition(x, y - height / 2 + 11)
        .setFontSize("11px")
        .setText(isSelected && itemData ? itemData.name : "")
        .setVisible(isSelected);

      // --------------------------------------------------
      // ICON
      // --------------------------------------------------

      this.setSlotIcon(slot, itemData, isSelected, x, y, width, height);

      // --------------------------------------------------
      // COST
      // --------------------------------------------------

      slot.costBackground.setVisible(false);

      for (const entry of slot.resourceCosts) {
        entry.icon.setVisible(false);
        entry.text.setVisible(false);
      }

      if (isSelected && itemData?.cost) {
        this.updateResourceCosts(slot, itemData.cost, x, y + height / 2 - 12);
      }

      // --------------------------------------------------
      // STYLE
      // --------------------------------------------------

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
    return this.scene.scale.height - (this.isMobile ? 70 : 100);
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

    const leftEdge = centerX - this.panelWidth / 2;

    const rightEdge = centerX + this.panelWidth / 2;

    const width = this.panelWidth;
    const height = this.panelHeight;

    this.dock.clear();

    this.dock.fillStyle(0x11161b, 0.5).fillRoundedRect(leftEdge, y - height / 2, width, height, 18);

    this.dock.lineStyle(1, 0x4a5159, 0.9).strokeRoundedRect(leftEdge, y - height / 2, width, height, 18);

    this.dockHighlight.clear();

    this.dockHighlight.lineStyle(1, 0x242a31, 0.5).strokeRoundedRect(leftEdge + 3, y - height / 2 + 3, width - 6, height - 6, 15);
  }

  resetUIPosition() {
    const centerX = this.getCenterX();
    const y = this.getY();

    const panelLeft = centerX - this.panelWidth / 2;

    const panelRight = centerX + this.panelWidth / 2;

    // --------------------------------------------------
    // LEFT ARROW
    // --------------------------------------------------

    const leftX = panelLeft + this.panelPadding + this.arrowWidth / 2;

    this.leftButton.setPosition(leftX, y);

    this.leftButtonText.setPosition(leftX, y);

    // --------------------------------------------------
    // ACTION BUTTON
    // --------------------------------------------------

    // ActionButtonUI is still owned by InputController.
    // We only use its radius to reserve space for it.
    const actionRadius = this.scene.inputController?.actionButtonUI?.radius ?? 38;

    // --------------------------------------------------
    // RIGHT ARROW
    // --------------------------------------------------

    const actionX = panelRight - this.panelPadding - actionRadius;

    const rightX = actionX - actionRadius - this.actionGap - this.arrowWidth / 2;

    this.rightButton.setPosition(rightX, y);

    this.rightButtonText.setPosition(rightX, y);

    // --------------------------------------------------
    // ITEM VIEWPORT
    // --------------------------------------------------

    this.viewportLeft = leftX + this.arrowWidth / 2 + this.viewportPadding;

    this.viewportRight = rightX - this.arrowWidth / 2 - this.viewportPadding;

    this.viewportWidth = Math.max(0, this.viewportRight - this.viewportLeft);

    // --------------------------------------------------
    // DOCK
    // --------------------------------------------------

    this.updateDock();
  }
}
