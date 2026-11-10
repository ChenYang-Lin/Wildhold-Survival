export default class InventorySlotsPanel {
  constructor(scene, container, onSelectItem) {
    this.scene = scene;
    this.container = container;
    this.onSelectItem = onSelectItem;

    this.slotCount = 20;
    this.slots = [];
    this.selectedIndex = null;

    this.create();
  }

  create() {
    this.grid = document.createElement("div");
    this.grid.classList.add("inventory-slot-grid");

    this.container.appendChild(this.grid);

    for (let i = 0; i < this.slotCount; i++) {
      const slot = document.createElement("button");

      slot.type = "button";
      slot.classList.add("inventory-slot");

      slot.addEventListener("click", () => {
        const item = this.scene.inventorySystem.inventory[i] ?? null;

        this.selectedIndex = i;
        this.updateSelection();

        this.onSelectItem(item);
      });

      this.grid.appendChild(slot);
      this.slots.push(slot);
    }

    this.refresh();
  }

  refresh() {
    const inventory = this.scene.inventorySystem.inventory;

    this.slots.forEach((slotElement, index) => {
      const item = inventory[index] ?? null;

      slotElement.replaceChildren();
      slotElement.classList.toggle("empty", !item);

      if (!item) {
        slotElement.title = "Empty slot";
        return;
      }

      const icon = this.createItemIcon(item.id);
      slotElement.appendChild(icon);

      const amount = document.createElement("span");
      amount.classList.add("inventory-slot-amount");
      amount.textContent = item.amount;

      slotElement.appendChild(amount);

      slotElement.title = `${this.formatItemName(item.id)} x${item.amount}`;
    });

    this.updateSelection();
  }

  updateSelection() {
    this.slots.forEach((slot, index) => {
      slot.classList.toggle("selected", index === this.selectedIndex);
    });
  }

  createItemIcon(itemId) {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    canvas.classList.add("inventory-slot-icon");

    const context = canvas.getContext("2d");

    if (this.scene.textures.exists(itemId)) {
      const texture = this.scene.textures.get(itemId);
      const frame = texture.get();
      const source = frame.source.image;

      context.imageSmoothingEnabled = false;

      context.drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 2, 2, 44, 44);
    } else {
      context.fillStyle = "#ffffff";
      context.font = "bold 18px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(itemId.charAt(0).toUpperCase(), 24, 24);
    }

    return canvas;
  }

  formatItemName(id) {
    return id
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
