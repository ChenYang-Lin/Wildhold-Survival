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

    this.slotSpacing = this.config.slotSpacing;

    this.panelPadding = this.config.panelPadding;
    this.viewportPadding = this.config.viewportPadding;

    this.slots = [];

    //
    this.viewportLeft = 0;
    this.viewportRight = 0;
    this.viewportWidth = 0;

    // HotBar scroll
    this.scrollOffset = 0;

    this.hotbarPointerId = null;
    this.hotbarDragStartX = 0;
    this.hotbarStartScrollOffset = 0;
    this.hotbarDragging = false;

    this.hotbarDragThreshold = 8;

    this.viewportMask = this.scene.make
      .graphics({
        x: 0,
        y: 0,
        add: false,
      })
      .setScrollFactor(0);

    this.resetUIPosition();
    this.setupDragScrolling();
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

      itemIndex: -1,
      itemId: null,
    };

    // background.on("pointerdown", () => {
    //   if (slot.itemIndex === -1) return;

    //   const itemId = slot.itemId;

    //   if (!itemId) return;

    //   this.playSlotPress(slot);

    //   this.scene.hotbarSystem.activateItem(itemId);
    // });

    this.applyViewportMask(slot);

    return slot;
  }

  getDockHeight() {
    return this.panelHeight;
  }

  getItemWidth() {
    return this.slotWidth;
  }

  getContentWidth(items) {
    if (items.length === 0) {
      return 0;
    }

    return items.length * this.slotWidth + (items.length - 1) * this.slotSpacing;
  }

  getMaxScrollOffset(items) {
    return Math.max(0, this.getContentWidth(items) - this.viewportWidth);
  }

  clampScrollOffset() {
    const items = this.scene.hotbarSystem.getItems();

    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.getMaxScrollOffset(items));
  }

  getSlotAtPointer(pointer) {
    for (const slot of this.slots) {
      if (!slot.background.visible) continue;
      if (slot.itemIndex === -1) continue;

      const bounds = slot.background.getBounds();

      if (bounds.contains(pointer.x, pointer.y)) {
        return slot;
      }
    }

    return null;
  }

  setupDragScrolling() {
    this.scene.input.on("pointerdown", (pointer) => {
      if (!this.isPointerInViewport(pointer)) return;

      this.hotbarPointerId = pointer.id;
      this.hotbarDragStartX = pointer.x;
      this.hotbarStartScrollOffset = this.scrollOffset;
      this.hotbarDragging = false;
    });

    this.scene.input.on("pointermove", (pointer) => {
      if (pointer.id !== this.hotbarPointerId) return;

      const dx = pointer.x - this.hotbarDragStartX;

      if (!this.hotbarDragging) {
        if (Math.abs(dx) < this.hotbarDragThreshold) {
          return;
        }

        this.hotbarDragging = true;
      }

      this.scrollOffset = this.hotbarStartScrollOffset - dx;

      this.clampScrollOffset();
    });

    this.scene.input.on("pointerup", (pointer) => {
      if (pointer.id !== this.hotbarPointerId) return;

      if (!this.hotbarDragging) {
        const slot = this.getSlotAtPointer(pointer);

        if (slot && slot.itemIndex !== -1 && slot.itemId) {
          this.playSlotPress(slot);
          this.scene.hotbarSystem.activateItem(slot.itemId);
        }
      }

      this.hotbarPointerId = null;
      this.hotbarDragging = false;
    });
  }

  isPointerInViewport(pointer) {
    const y = this.getY();

    const top = y - this.panelHeight / 2;
    const bottom = y + this.panelHeight / 2;

    return pointer.x >= this.viewportLeft && pointer.x <= this.viewportRight && pointer.y >= top && pointer.y <= bottom;
  }

  playSlotPress(slot) {
    this.scene.tweens.killTweensOf(slot.background);
    this.scene.tweens.killTweensOf(slot.iconFrame);
    this.scene.tweens.killTweensOf(slot.icon);

    slot.background.setScale(1);
    slot.iconFrame.setScale(1);
    slot.icon.setScale(slot.icon.scaleX, slot.icon.scaleY);

    this.scene.tweens.add({
      targets: [slot.background, slot.iconFrame, slot.icon],
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 60,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  update() {
    const items = this.scene.hotbarSystem.getItems();

    while (this.slots.length < items.length) {
      this.slots.push(this.createSlot());
    }

    this.clampScrollOffset();

    const contentWidth = this.getContentWidth(items);

    const y = this.getY();

    let currentX;

    if (contentWidth <= this.viewportWidth) {
      // Not enough items to overflow.
      // Keep them centered.
      currentX = this.viewportLeft + (this.viewportWidth - contentWidth) / 2;
    } else {
      // Overflowing content starts at the left edge
      // and moves continuously with scrollOffset.
      currentX = this.viewportLeft - this.scrollOffset;
    }

    for (let slotIndex = 0; slotIndex < this.slots.length; slotIndex++) {
      const slot = this.slots[slotIndex];

      if (slotIndex >= items.length) {
        slot.itemIndex = -1;
        slot.itemId = null;

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

      slot.itemIndex = slotIndex;

      const width = this.slotWidth;
      const height = this.slotHeight;

      const x = currentX + width / 2;

      slot.background.setPosition(x, y).setSize(width, height).setVisible(true);

      slot.iconFrame.setPosition(x, y).setSize(40, 40).setVisible(true);

      slot.shadow
        .setPosition(x, y + 3)
        .setSize(width + 4, height + 4)
        .setVisible(true);

      const itemId = items[slotIndex];

      slot.itemId = itemId;

      const itemData = this.scene.hotbarSystem.getItemData(itemId);

      slot.nameText
        .setPosition(x, y - height / 2 + 11)
        .setFontSize("11px")
        .setText(itemData?.name ?? "")
        .setVisible(true);

      this.setSlotIcon(slot, itemData, x, y);

      slot.costBackground.setVisible(false);

      for (const entry of slot.resourceCosts) {
        entry.icon.setVisible(false);
        entry.text.setVisible(false);
      }

      if (itemData?.cost) {
        this.updateResourceCosts(slot, itemData.cost, x, y + height / 2 - 12);
      }

      slot.background.setFillStyle(0x171b20).setStrokeStyle(1, 0x454c55, 0.9);

      slot.iconFrame.setFillStyle(0x111419).setStrokeStyle(1, 0x343a42, 0.8);

      slot.shadow.setFillStyle(0x000000, 0.4);
      slot.nameText.setColor("#ffffff");

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

    const mask = this.viewportMask.createGeometryMask();

    icon.setMask(mask);
    text.setMask(mask);

    return {
      icon,
      text,
    };
  }

  setSlotIcon(slot, itemData, x, y) {
    if (!itemData) {
      slot.icon.setVisible(false);
      return;
    }

    const maxIconWidth = 32;
    const maxIconHeight = 32;

    const scale = Math.min(maxIconWidth / itemData.spriteWidth, maxIconHeight / itemData.spriteHeight);

    slot.icon.setTexture(itemData.icon).setPosition(x, y).setScale(scale).setVisible(true);
  }

  applyViewportMask(slot) {
    const mask = this.viewportMask.createGeometryMask();

    slot.shadow.setMask(mask);
    slot.background.setMask(mask);
    slot.iconFrame.setMask(mask);
    slot.nameText.setMask(mask);
    slot.icon.setMask(mask);
    slot.costBackground.setMask(mask);

    for (const entry of slot.resourceCosts) {
      entry.icon.setMask(mask);
      entry.text.setMask(mask);
    }
  }

  updateViewportMask() {
    this.viewportMask.clear();

    this.viewportMask.fillStyle(0xffffff);

    const y = this.getY();

    this.viewportMask.fillRect(this.viewportLeft, y - this.panelHeight / 2, this.viewportWidth, this.panelHeight);
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

    this.viewportLeft = panelLeft + this.panelPadding;
    this.viewportRight = panelRight - this.panelPadding;

    this.viewportWidth = Math.max(0, this.viewportRight - this.viewportLeft);

    this.updateViewportMask();
    this.updateDock();
  }
}
