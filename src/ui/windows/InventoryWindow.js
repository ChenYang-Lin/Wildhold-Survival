import BaseWindow from "./BaseWindow.js";
import InventorySlotsPanel from "../components/InventorySlotsPanel.js";
import InventoryDetailsPanel from "../components/InventoryDetailsPanel.js";

export default class InventoryWindow extends BaseWindow {
  constructor(scene) {
    super(scene, "Inventory", InventoryWindow.createHTML());

    this.element.classList.add("inventory-window");

    this.slotsPanel = this.element.querySelector(".inventory-slots-panel");
    this.detailsPanel = this.element.querySelector(".inventory-details-panel");

    this.inventorySlotsPanel = new InventorySlotsPanel(scene, this.slotsPanel, (item) => {
      this.inventoryDetailsPanel.showItem(item);
    });

    this.inventoryDetailsPanel = new InventoryDetailsPanel(scene, this.detailsPanel);

    this.initialize();
  }

  static createHTML() {
    return `
      <header class="inventory-header">
        <h2>Inventory</h2>
        <button class="close-button" type="button" aria-label="Close">×</button>
      </header>

      <main class="inventory-content">
        <section class="inventory-panel inventory-slots-panel">
          <h3>Items</h3>
        </section>

        <section class="inventory-panel inventory-details-panel">
          <h3>Item Details</h3>
        </section>
      </main>
    `;
  }

  initialize() {
    this.hide();

    // Press B to toggle the inventory window.
    this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.toggleKey.on("down", this.toggle, this);

    // Close button.
    this.onCloseClick = () => this.hide();

    this.element.querySelector(".close-button").addEventListener("click", this.onCloseClick);

    this.inventorySlotsPanel.refresh();
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.scene.equipmentWindow?.hide();

    this.refresh();
    super.show();
  }

  refresh() {
    this.inventorySlotsPanel.refresh();
  }

  destroy() {
    if (this.destroyed) return;

    this.toggleKey?.off("down", this.toggle, this);

    this.element?.querySelector(".close-button")?.removeEventListener("click", this.onCloseClick);

    super.destroy();
  }
}
