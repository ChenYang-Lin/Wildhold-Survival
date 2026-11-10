export default class InventoryDetailsPanel {
  constructor(scene, container) {
    this.scene = scene;
    this.container = container;

    this.create();
  }

  create() {
    this.content = document.createElement("div");
    this.content.classList.add("inventory-details-content");

    this.container.appendChild(this.content);

    this.showItem(null);
  }

  showItem(item) {
    this.content.replaceChildren();

    if (!item) {
      const message = document.createElement("p");
      message.classList.add("inventory-details-empty");
      message.textContent = "Select an item to view its details.";

      this.content.appendChild(message);
      return;
    }

    const icon = this.createItemIcon(item.id);
    this.content.appendChild(icon);

    const name = document.createElement("h3");
    name.classList.add("inventory-details-name");
    name.textContent = this.formatItemName(item.id);

    this.content.appendChild(name);

    const type = document.createElement("p");
    type.classList.add("inventory-details-info");
    type.textContent = `Type: ${item.type}`;

    const amount = document.createElement("p");
    amount.classList.add("inventory-details-info");
    amount.textContent = `Quantity: ${item.amount}`;

    this.content.append(type, amount);
  }

  createItemIcon(itemId) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    canvas.classList.add("inventory-details-icon");

    const context = canvas.getContext("2d");

    if (this.scene.textures.exists(itemId)) {
      const texture = this.scene.textures.get(itemId);
      const frame = texture.get();
      const source = frame.source.image;

      context.imageSmoothingEnabled = false;

      context.drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 2, 2, 60, 60);
    } else {
      context.fillStyle = "#ffffff";
      context.font = "bold 24px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(itemId.charAt(0).toUpperCase(), 32, 32);
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
